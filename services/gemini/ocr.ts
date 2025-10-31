// OCR Processing Service
// AI-powered document processing and data extraction

import { GeminiService } from './client';
import type { ProcessedDocument, DocumentType } from '@/types/database';

/**
 * Extracted invoice data
 */
interface InvoiceData {
  invoiceNumber: string;
  date: string;
  vendorName: string;
  vendorAddress?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Extracted purchase order data
 */
interface PurchaseOrderData {
  poNumber: string;
  date: string;
  supplierName: string;
  deliveryAddress?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  total: number;
  expectedDeliveryDate?: string;
}

/**
 * Extracted medical report data
 */
interface MedicalReportData {
  patientName: string;
  patientId?: string;
  date: string;
  doctorName: string;
  hospitalName?: string;
  diagnosis: string;
  symptoms?: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  recommendations?: string;
  followUpDate?: string;
}

/**
 * Extracted prescription data
 */
interface PrescriptionData {
  patientName: string;
  date: string;
  doctorName: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  instructions?: string;
}

/**
 * Extracted lab result data
 */
interface LabResultData {
  patientName: string;
  date: string;
  testType: string;
  results: Array<{
    test: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    status?: string;
  }>;
  interpretation?: string;
}

/**
 * OCR Service Class
 * Provides document processing and data extraction using Gemini Vision
 */
export class OCRService {
  constructor(private gemini: GeminiService) {}

  /**
   * Process a document file and extract structured data
   */
  async processDocument(file: File): Promise<ProcessedDocument> {
    // 1. Convert file to base64
    const base64 = await this.fileToBase64(file);
    const mimeType = file.type;

    // 2. Detect document type
    const docType = await this.detectDocumentType(base64, mimeType);

    // 3. Extract data based on document type
    const extractedData = await this.extractDataByType(base64, mimeType, docType);

    // 4. Extract full text
    const fullText = await this.extractFullText(base64, mimeType);

    // 5. Calculate confidence score
    const confidence = this.calculateConfidence(extractedData, fullText);

    return {
      documentType: docType,
      extractedData,
      fullText,
      confidence,
      processedAt: new Date(),
    };
  }

  /**
   * Process multiple documents in batch
   */
  async processBatch(files: File[]): Promise<ProcessedDocument[]> {
    const results: ProcessedDocument[] = [];

    for (const file of files) {
      try {
        const result = await this.processDocument(file);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Continue with other files
      }
    }

    return results;
  }

  /**
   * Extract specific fields from a document
   */
  async extractFields(
    file: File,
    fields: string[]
  ): Promise<Record<string, any>> {
    const base64 = await this.fileToBase64(file);
    const mimeType = file.type;

    const prompt = `
Extract the following specific fields from this document:

Fields to extract:
${fields.map(f => `- ${f}`).join('\n')}

Return JSON format with the field names as keys and extracted values.
If a field is not found, use null as the value.

Return ONLY the JSON object, no additional text.
`;

    const result = await this.gemini.analyzeImage(base64, prompt, mimeType);
    
    try {
      return JSON.parse(result);
    } catch {
      // If parsing fails, return empty object
      return {};
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Detect document type from image
   */
  private async detectDocumentType(
    base64: string,
    mimeType: string
  ): Promise<DocumentType> {
    const prompt = `
Identify the type of this document. Choose from:
- invoice
- purchase_order
- medical_report
- prescription
- lab_result
- delivery_note
- other

Look for key indicators like:
- Invoice: "Invoice", "Bill", invoice number, payment terms
- Purchase Order: "PO", "Purchase Order", order number
- Medical Report: patient information, diagnosis, doctor's notes
- Prescription: "Rx", medication list, doctor signature
- Lab Result: test results, reference ranges, lab name
- Delivery Note: "Delivery", shipping information, tracking number

Return ONLY the document type as a single word (e.g., "invoice"), no additional text.
`;

    const response = await this.gemini.analyzeImage(base64, prompt, mimeType);
    const docType = response.trim().toLowerCase() as DocumentType;

    // Validate the response
    const validTypes: DocumentType[] = [
      'invoice',
      'purchase_order',
      'medical_report',
      'prescription',
      'lab_result',
      'delivery_note',
      'other',
    ];

    return validTypes.includes(docType) ? docType : 'other';
  }

  /**
   * Extract data based on document type
   */
  private async extractDataByType(
    base64: string,
    mimeType: string,
    docType: DocumentType
  ): Promise<any> {
    const prompt = this.getExtractionPrompt(docType);
    const response = await this.gemini.analyzeImage(base64, prompt, mimeType);

    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                       response.match(/```\s*([\s\S]*?)\s*```/);
      
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      return JSON.parse(jsonString.trim());
    } catch (error) {
      console.error('Failed to parse extracted data:', error);
      return { raw: response };
    }
  }

  /**
   * Get extraction prompt for specific document type
   */
  private getExtractionPrompt(docType: DocumentType): string {
    const prompts: Record<DocumentType, string> = {
      invoice: `
Extract invoice data in JSON format:
{
  "invoiceNumber": "",
  "date": "YYYY-MM-DD",
  "vendorName": "",
  "vendorAddress": "",
  "items": [
    {
      "description": "",
      "quantity": 0,
      "unitPrice": 0,
      "total": 0
    }
  ],
  "subtotal": 0,
  "tax": 0,
  "total": 0
}

Extract all line items and calculate totals accurately.
Return ONLY the JSON object, no additional text.
`,
      purchase_order: `
Extract purchase order data in JSON format:
{
  "poNumber": "",
  "date": "YYYY-MM-DD",
  "supplierName": "",
  "deliveryAddress": "",
  "items": [
    {
      "description": "",
      "quantity": 0,
      "unitPrice": 0,
      "total": 0
    }
  ],
  "subtotal": 0,
  "total": 0,
  "expectedDeliveryDate": "YYYY-MM-DD"
}

Return ONLY the JSON object, no additional text.
`,
      medical_report: `
Extract medical report data in JSON format:
{
  "patientName": "",
  "patientId": "",
  "date": "YYYY-MM-DD",
  "doctorName": "",
  "hospitalName": "",
  "diagnosis": "",
  "symptoms": [],
  "medications": [
    {
      "name": "",
      "dosage": "",
      "frequency": ""
    }
  ],
  "recommendations": "",
  "followUpDate": "YYYY-MM-DD"
}

Return ONLY the JSON object, no additional text.
`,
      prescription: `
Extract prescription data in JSON format:
{
  "patientName": "",
  "date": "YYYY-MM-DD",
  "doctorName": "",
  "medications": [
    {
      "name": "",
      "dosage": "",
      "frequency": "",
      "duration": ""
    }
  ],
  "instructions": ""
}

Return ONLY the JSON object, no additional text.
`,
      lab_result: `
Extract lab result data in JSON format:
{
  "patientName": "",
  "date": "YYYY-MM-DD",
  "testType": "",
  "results": [
    {
      "test": "",
      "value": "",
      "unit": "",
      "referenceRange": "",
      "status": "normal|abnormal|critical"
    }
  ],
  "interpretation": ""
}

Return ONLY the JSON object, no additional text.
`,
      delivery_note: `
Extract delivery note data in JSON format:
{
  "deliveryNumber": "",
  "date": "YYYY-MM-DD",
  "recipient": "",
  "address": "",
  "items": [
    {
      "description": "",
      "quantity": 0
    }
  ],
  "trackingNumber": "",
  "carrier": ""
}

Return ONLY the JSON object, no additional text.
`,
      other: `
Extract all structured data from this document in JSON format.
Identify key fields and their values.

Return ONLY the JSON object, no additional text.
`,
    };

    return prompts[docType] || prompts.other;
  }

  /**
   * Extract full text from document
   */
  private async extractFullText(
    base64: string,
    mimeType: string
  ): Promise<string> {
    const prompt = `
Extract all text from this document.
Preserve the structure and formatting as much as possible.
Return the complete text content.
`;

    const text = await this.gemini.analyzeImage(base64, prompt, mimeType);
    return text;
  }

  /**
   * Convert file to base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Calculate confidence score for extraction
   */
  private calculateConfidence(extractedData: any, fullText: string): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence if we have structured data
    if (extractedData && typeof extractedData === 'object') {
      const fields = Object.keys(extractedData);
      const filledFields = fields.filter(
        key => extractedData[key] !== null && extractedData[key] !== '' && extractedData[key] !== undefined
      );

      const fillRate = filledFields.length / fields.length;
      confidence += fillRate * 0.3;
    }

    // Increase confidence if we have substantial text
    if (fullText && fullText.length > 100) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Validate extracted data against expected schema
   */
  validateExtractedData(
    data: any,
    docType: DocumentType
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (docType) {
      case 'invoice':
        if (!data.invoiceNumber) errors.push('Missing invoice number');
        if (!data.date) errors.push('Missing date');
        if (!data.vendorName) errors.push('Missing vendor name');
        if (!data.items || data.items.length === 0) errors.push('Missing line items');
        if (data.total === undefined || data.total === null) errors.push('Missing total amount');
        break;

      case 'medical_report':
        if (!data.patientName) errors.push('Missing patient name');
        if (!data.date) errors.push('Missing date');
        if (!data.diagnosis) errors.push('Missing diagnosis');
        break;

      case 'prescription':
        if (!data.patientName) errors.push('Missing patient name');
        if (!data.medications || data.medications.length === 0) {
          errors.push('Missing medications');
        }
        break;

      // Add more validation for other document types
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Suggest corrections for OCR errors
   */
  async suggestCorrections(
    extractedData: any,
    fullText: string
  ): Promise<Record<string, string>> {
    const prompt = `
Review this extracted data and suggest corrections for any OCR errors:

Extracted Data:
${JSON.stringify(extractedData, null, 2)}

Full Text:
${fullText.substring(0, 1000)}

Identify fields that may have OCR errors (e.g., misread numbers, garbled text).
Suggest corrections based on context and the full text.

Return JSON format:
{
  "fieldName": "suggested correction",
  "anotherField": "another correction"
}

Only include fields that need correction.
Return ONLY the JSON object, no additional text.
`;

    try {
      const corrections = await this.gemini.generateJSON<Record<string, string>>(prompt);
      return corrections;
    } catch {
      return {};
    }
  }
}
