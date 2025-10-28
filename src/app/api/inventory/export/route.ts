import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// GET handler for exporting inventory items
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const destinations = searchParams.get("destinations")?.split(",").filter(Boolean) || [];
    const categories = searchParams.get("categories")?.split(",").filter(Boolean) || [];

    // Validate format
    if (!["csv", "excel", "pdf", "json"].includes(format)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid format. Supported formats: csv, excel, pdf, json",
          },
        },
        { status: 400 }
      );
    }

    // Build where clause for filtering (same as GET /api/inventory)
    const where: Prisma.InventoryItemWhereInput = {};

    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: "insensitive" } },
        { batch: { contains: search, mode: "insensitive" } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    if (destinations.length > 0) {
      where.destination = { in: destinations as ("MAIS" | "FOZAN")[] };
    }

    if (categories.length > 0) {
      where.category = { in: categories };
    }

    // Fetch all matching items (no pagination for export)
    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        enteredBy: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Generate export based on format
    let fileContent: Buffer | string;
    let contentType: string;
    let fileName: string;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);

    switch (format) {
      case "csv":
        fileContent = generateCSV(items);
        contentType = "text/csv; charset=utf-8";
        fileName = `inventory-export-${timestamp}.csv`;
        break;

      case "excel":
        fileContent = generateExcel(items);
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        fileName = `inventory-export-${timestamp}.xlsx`;
        break;

      case "pdf":
        fileContent = generatePDF(items);
        contentType = "application/pdf";
        fileName = `inventory-export-${timestamp}.pdf`;
        break;

      case "json":
        fileContent = generateJSON(items);
        contentType = "application/json";
        fileName = `inventory-export-${timestamp}.json`;
        break;

      default:
        throw new Error("Unsupported format");
    }

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "EXPORT",
      entityType: "InventoryItem",
      newValue: {
        format,
        itemCount: items.length,
        filters: { search, dateFrom, dateTo, destinations, categories },
      },
      ipAddress,
      userAgent,
    });

    // Return file
    const response = new NextResponse(fileContent as any);
    response.headers.set("Content-Type", contentType);
    response.headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
    
    return response;
  } catch (error) {
    console.error("Error exporting inventory items:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while exporting inventory items",
        },
      },
      { status: 500 }
    );
  }
}

// Helper function to generate CSV with UTF-8 BOM
function generateCSV(items: any[]): Buffer {
  const headers = [
    "Item Name",
    "Batch Number",
    "Quantity",
    "Reject Quantity",
    "Reject %",
    "Destination",
    "Category",
    "Notes",
    "Entered By",
    "Entered By Email",
    "Role",
    "Created At",
  ];

  const rows = items.map((item) => [
    item.itemName,
    item.batch,
    item.quantity,
    item.reject,
    ((item.reject / item.quantity) * 100).toFixed(2) + "%",
    item.destination,
    item.category || "",
    item.notes || "",
    item.enteredBy.name,
    item.enteredBy.email,
    item.enteredBy.role,
    new Date(item.createdAt).toLocaleString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => {
        // Escape cells containing commas, quotes, or newlines
        const cellStr = String(cell);
        if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(",")
    ),
  ].join("\n");

  // Add UTF-8 BOM for proper Excel compatibility
  const BOM = "\uFEFF";
  return Buffer.from(BOM + csvContent, "utf-8");
}

// Helper function to generate Excel with formatting
function generateExcel(items: any[]): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(
    items.map((item) => ({
      "Item Name": item.itemName,
      "Batch Number": item.batch,
      Quantity: item.quantity,
      "Reject Quantity": item.reject,
      "Reject %": ((item.reject / item.quantity) * 100).toFixed(2) + "%",
      Destination: item.destination,
      Category: item.category || "",
      Notes: item.notes || "",
      "Entered By": item.enteredBy.name,
      "Entered By Email": item.enteredBy.email,
      Role: item.enteredBy.role,
      "Created At": new Date(item.createdAt).toLocaleString(),
    }))
  );

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = [
    { wch: 25 }, // Item Name
    { wch: 15 }, // Batch Number
    { wch: 10 }, // Quantity
    { wch: 15 }, // Reject Quantity
    { wch: 10 }, // Reject %
    { wch: 12 }, // Destination
    { wch: 15 }, // Category
    { wch: 30 }, // Notes
    { wch: 20 }, // Entered By
    { wch: 25 }, // Entered By Email
    { wch: 12 }, // Role
    { wch: 20 }, // Created At
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

// Helper function to generate PDF with company branding
function generatePDF(items: any[]): Buffer {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Add company branding
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Saudi Mais Co. for Medical Products", 15, 15);

  doc.setFontSize(16);
  doc.text("Inventory Export Report", 15, 25);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 32);
  doc.text(`Total Items: ${items.length}`, 15, 37);

  // Add table
  const tableData = items.map((item) => [
    item.itemName,
    item.batch,
    item.quantity.toString(),
    item.reject.toString(),
    ((item.reject / item.quantity) * 100).toFixed(2) + "%",
    item.destination,
    item.category || "-",
    item.enteredBy.name,
    new Date(item.createdAt).toLocaleDateString(),
  ]);

  autoTable(doc, {
    head: [
      [
        "Item Name",
        "Batch",
        "Qty",
        "Reject",
        "Reject %",
        "Destination",
        "Category",
        "Entered By",
        "Date",
      ],
    ],
    body: tableData,
    startY: 45,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 45, left: 15, right: 15 },
    didDrawPage: (data) => {
      // Add page numbers
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    },
  });

  return Buffer.from(doc.output("arraybuffer"));
}

// Helper function to generate JSON with metadata
function generateJSON(items: any[]): string {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedBy: "System",
      totalItems: items.length,
      version: "1.0",
    },
    data: items.map((item) => ({
      id: item.id,
      itemName: item.itemName,
      batch: item.batch,
      quantity: item.quantity,
      reject: item.reject,
      rejectPercentage: ((item.reject / item.quantity) * 100).toFixed(2),
      destination: item.destination,
      category: item.category,
      notes: item.notes,
      enteredBy: {
        name: item.enteredBy.name,
        email: item.enteredBy.email,
        role: item.enteredBy.role,
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}
