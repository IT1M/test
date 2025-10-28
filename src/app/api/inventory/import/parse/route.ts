import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { withSecurity } from "@/middleware/security";

// File parsing handler
async function postHandler(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check authorization - DATA_ENTRY role or higher
    const allowedRoles = ["DATA_ENTRY", "SUPERVISOR", "MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "No file provided" } },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid file type. Please upload CSV or Excel files only." } },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "File size exceeds 10MB limit" } },
        { status: 400 }
      );
    }

    // Parse file based on type
    let parsedData: any[] = [];

    if (file.type === "text/csv") {
      parsedData = await parseCSV(file);
    } else {
      parsedData = await parseExcel(file);
    }

    // Validate and clean data
    const validatedData = validateImportData(parsedData);

    return NextResponse.json({
      success: true,
      data: validatedData.data,
      warnings: validatedData.warnings,
      meta: {
        fileName: file.name,
        fileSize: file.size,
        totalRows: validatedData.data.length,
        originalRows: parsedData.length,
      },
    });
  } catch (error) {
    console.error("Error parsing import file:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while parsing the file",
        },
      },
      { status: 500 }
    );
  }
}

// Parse CSV file
async function parseCSV(file: File): Promise<any[]> {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error("CSV file must contain at least a header row and one data row");
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const data: any[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue; // Skip empty rows
    
    const row: any = {};
    headers.forEach((header, index) => {
      const normalizedHeader = normalizeColumnName(header);
      row[normalizedHeader] = values[index]?.trim() || "";
    });
    
    data.push(row);
  }

  return data;
}

// Parse Excel file (simplified - in production, use a library like xlsx)
async function parseExcel(file: File): Promise<any[]> {
  // For now, return error - would need xlsx library in production
  throw new Error("Excel parsing not implemented. Please use CSV format.");
}

// Parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// Normalize column names to match expected fields
function normalizeColumnName(name: string): string {
  const normalized = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  
  const mappings: Record<string, string> = {
    'itemname': 'itemName',
    'item': 'itemName',
    'name': 'itemName',
    'product': 'itemName',
    'batch': 'batch',
    'batchnumber': 'batch',
    'lot': 'batch',
    'quantity': 'quantity',
    'qty': 'quantity',
    'amount': 'quantity',
    'reject': 'reject',
    'rejects': 'reject',
    'rejectquantity': 'reject',
    'defective': 'reject',
    'destination': 'destination',
    'dest': 'destination',
    'location': 'destination',
    'category': 'category',
    'cat': 'category',
    'type': 'category',
    'notes': 'notes',
    'note': 'notes',
    'comments': 'notes',
    'comment': 'notes',
  };
  
  return mappings[normalized] || normalized;
}

// Validate and clean import data
function validateImportData(data: any[]): { data: any[]; warnings: string[] } {
  const warnings: string[] = [];
  const validatedData: any[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const validatedRow: any = {};
    
    // Required fields validation
    const requiredFields = ['itemName', 'batch', 'quantity', 'reject', 'destination'];
    let hasAllRequired = true;
    
    for (const field of requiredFields) {
      if (!row[field] || row[field].toString().trim() === '') {
        warnings.push(`Row ${i + 1}: Missing required field '${field}'`);
        hasAllRequired = false;
      }
    }
    
    if (!hasAllRequired) {
      continue; // Skip this row
    }
    
    // Clean and validate data
    validatedRow.itemName = row.itemName.toString().trim();
    validatedRow.batch = row.batch.toString().trim().toUpperCase();
    
    // Validate quantity
    const quantity = parseInt(row.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      warnings.push(`Row ${i + 1}: Invalid quantity '${row.quantity}'`);
      continue;
    }
    validatedRow.quantity = quantity;
    
    // Validate reject
    const reject = parseInt(row.reject || 0);
    if (isNaN(reject) || reject < 0) {
      warnings.push(`Row ${i + 1}: Invalid reject quantity '${row.reject}'`);
      continue;
    }
    if (reject > quantity) {
      warnings.push(`Row ${i + 1}: Reject quantity cannot exceed total quantity`);
      continue;
    }
    validatedRow.reject = reject;
    
    // Validate destination
    const destination = row.destination.toString().trim().toUpperCase();
    if (!['MAIS', 'FOZAN'].includes(destination)) {
      warnings.push(`Row ${i + 1}: Invalid destination '${row.destination}'. Must be MAIS or FOZAN`);
      continue;
    }
    validatedRow.destination = destination;
    
    // Optional fields
    validatedRow.category = row.category ? row.category.toString().trim() : "";
    validatedRow.notes = row.notes ? row.notes.toString().trim() : "";
    
    validatedData.push(validatedRow);
  }
  
  return { data: validatedData, warnings };
}

// Export secured handler
export const POST = withSecurity(postHandler);