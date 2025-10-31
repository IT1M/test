// Medical Analysis Service
// AI-powered medical report analysis and product demand prediction

import { GeminiService } from './client';
import { db } from '@/lib/db/schema';
import type { MedicalAnalysis, DemandPrediction, Product } from '@/types/database';

/**
 * Medical Analysis Service Class
 * Provides AI-powered medical document analysis and insights
 */
export class MedicalAnalysisService {
  constructor(private gemini: GeminiService) {}

  /**
   * Analyze medical report and extract structured data
   */
  async analyzeMedicalReport(reportText: string): Promise<MedicalAnalysis> {
    const prompt = `
Analyze this medical report and extract structured information:

Medical Report:
${reportText}

Extract and return the following information in JSON format:
{
  "patientInfo": {
    "name": "patient name if mentioned",
    "age": age as number if mentioned,
    "gender": "male|female|other if mentioned"
  },
  "diagnosis": "primary diagnosis",
  "symptoms": ["symptom1", "symptom2"],
  "medications": [
    {
      "name": "medication name",
      "dosage": "dosage amount",
      "frequency": "how often to take",
      "duration": "how long to take"
    }
  ],
  "recommendations": ["recommendation1", "recommendation2"],
  "followUpDate": "date if mentioned (YYYY-MM-DD format)",
  "confidence": number (0-1, how confident you are in the extraction)
}

If any field is not found in the report, use null or empty array as appropriate.
Return ONLY the JSON object, no additional text.
`;

    const analysis = await this.gemini.generateJSON<MedicalAnalysis>(prompt);
    return analysis;
  }

  /**
   * Link medical records to available products
   */
  async linkMedicalRecordsToProducts(recordId: string): Promise<string[]> {
    // 1. Get the medical record
    const record = await db.medicalRecords.get(recordId);
    if (!record) {
      throw new Error(`Medical record with ID ${recordId} not found`);
    }

    // 2. Get all available products
    const allProducts = await db.products.where('isActive').equals(1 as any).toArray();

    // 3. Prepare prompt for matching
    const prompt = `
Match medications and treatments in this medical record to available products:

Medical Record:
- Diagnosis: ${record.diagnosis || 'N/A'}
- Medications: ${JSON.stringify(record.medications || [])}
- Content: ${record.content.substring(0, 500)}

Available Products:
${allProducts.map(p => `- ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Description: ${p.description}`).join('\n')}

Identify which products match the medications or treatments mentioned in the medical record.
Consider:
1. Exact medication name matches
2. Generic vs brand name equivalents
3. Product categories that match treatment needs
4. Related medical supplies or equipment

Return JSON array of matching product IDs:
{
  "matchedProducts": ["productId1", "productId2"],
  "reasoning": {
    "productId1": "why this product matches",
    "productId2": "why this product matches"
  }
}

Return ONLY the JSON object, no additional text.
`;

    const result = await this.gemini.generateJSON<{
      matchedProducts: string[];
      reasoning: Record<string, string>;
    }>(prompt);

    // 4. Update the medical record with linked products
    await db.medicalRecords.update(recordId, {
      linkedProductIds: result.matchedProducts,
    });

    return result.matchedProducts;
  }

  /**
   * Predict product demand based on medical trends
   */
  async predictProductDemandFromMedicalTrends(): Promise<DemandPrediction[]> {
    // 1. Get recent medical records (last 90 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const recentRecords = await db.medicalRecords
      .where('visitDate')
      .above(startDate)
      .toArray();

    if (recentRecords.length === 0) {
      return [];
    }

    // 2. Get all products
    const products = await db.products.where('isActive').equals(1 as any).toArray();

    // 3. Prepare data for analysis
    const medicalData = recentRecords.map(r => ({
      diagnosis: r.diagnosis,
      medications: r.medications,
      recordType: r.recordType,
      visitDate: r.visitDate,
    }));

    const prompt = `
Analyze medical records to predict product demand:

Recent Medical Records (Last 90 Days):
Total Records: ${recentRecords.length}

Diagnoses and Medications:
${JSON.stringify(medicalData.slice(0, 50), null, 2)}

Available Products:
${products.slice(0, 50).map(p => `- ${p.name} (${p.category})`).join('\n')}

Identify:
1. Common conditions being treated
2. Frequently prescribed medications
3. Emerging health trends
4. Predicted demand for related medical products

For each product with predicted increased demand, provide:
- Product ID or name
- Predicted demand increase
- Confidence score
- Reasoning

Return JSON array:
[
  {
    "productId": "id or name",
    "productName": "name",
    "predictedDemand": number (units expected),
    "confidence": number (0-1),
    "reasoning": "explanation based on medical trends"
  }
]

Return ONLY the JSON array, no additional text. If no significant trends, return empty array.
`;

    const predictions = await this.gemini.generateJSON<DemandPrediction[]>(prompt);

    // Match product names to IDs if needed
    const predictionsWithIds = predictions.map(pred => {
      const product = products.find(
        p => p.id === pred.productId || p.name.toLowerCase().includes(pred.productName.toLowerCase())
      );

      return {
        ...pred,
        productId: product?.id || pred.productId,
        productName: product?.name || pred.productName,
      };
    });

    return predictionsWithIds;
  }

  /**
   * Generate patient health summary from medical records
   */
  async generatePatientHealthSummary(patientId: string): Promise<{
    summary: string;
    currentConditions: string[];
    activeMedications: string[];
    riskFactors: string[];
    recommendations: string[];
  }> {
    // 1. Get patient information
    const patient = await db.patients.get(patientId);
    if (!patient) {
      throw new Error(`Patient with ID ${patientId} not found`);
    }

    // 2. Get all medical records for the patient
    const records = await db.medicalRecords
      .where('patientId')
      .equals(patientId)
      .sortBy('visitDate');

    const prompt = `
Generate a comprehensive health summary for this patient:

Patient Information:
- Name: ${patient.firstName} ${patient.lastName}
- Age: ${patient.age || 'Unknown'}
- Gender: ${patient.gender}
- Blood Type: ${patient.bloodType || 'Unknown'}
- Known Allergies: ${patient.allergies?.join(', ') || 'None'}
- Chronic Conditions: ${patient.chronicConditions?.join(', ') || 'None'}

Medical History (${records.length} records):
${records.map(r => `
Date: ${r.visitDate.toISOString().split('T')[0]}
Type: ${r.recordType}
Diagnosis: ${r.diagnosis || 'N/A'}
Medications: ${r.medications?.map(m => m.name).join(', ') || 'None'}
`).join('\n')}

Provide:
1. Overall health summary (2-3 sentences)
2. Current active conditions
3. Active medications (from most recent records)
4. Risk factors to monitor
5. Health recommendations

Return JSON format:
{
  "summary": "comprehensive health summary",
  "currentConditions": ["condition1", "condition2"],
  "activeMedications": ["med1", "med2"],
  "riskFactors": ["risk1", "risk2"],
  "recommendations": ["rec1", "rec2", "rec3"]
}

Return ONLY the JSON object, no additional text.
`;

    const healthSummary = await this.gemini.generateJSON<{
      summary: string;
      currentConditions: string[];
      activeMedications: string[];
      riskFactors: string[];
      recommendations: string[];
    }>(prompt);

    return healthSummary;
  }

  /**
   * Identify medication interactions in an order
   */
  async checkMedicationInteractions(productIds: string[]): Promise<{
    hasInteractions: boolean;
    interactions: Array<{
      products: string[];
      severity: 'low' | 'medium' | 'high';
      description: string;
      recommendation: string;
    }>;
  }> {
    if (productIds.length < 2) {
      return { hasInteractions: false, interactions: [] };
    }

    // Get product details
    const products = await Promise.all(
      productIds.map(id => db.products.get(id))
    );

    const validProducts = products.filter(p => p !== undefined) as Product[];

    const prompt = `
Check for potential medication interactions among these products:

Products:
${validProducts.map(p => `- ${p.name} (${p.category})\n  Description: ${p.description}`).join('\n')}

Identify any potential drug interactions, considering:
1. Known drug-drug interactions
2. Contraindications
3. Dosage concerns
4. Timing conflicts

For each interaction found, provide:
- Which products interact
- Severity level
- Description of the interaction
- Recommendation for healthcare provider

Return JSON format:
{
  "hasInteractions": boolean,
  "interactions": [
    {
      "products": ["product1", "product2"],
      "severity": "low|medium|high",
      "description": "what the interaction is",
      "recommendation": "what to do about it"
    }
  ]
}

Return ONLY the JSON object, no additional text.
`;

    const result = await this.gemini.generateJSON<{
      hasInteractions: boolean;
      interactions: Array<{
        products: string[];
        severity: 'low' | 'medium' | 'high';
        description: string;
        recommendation: string;
      }>;
    }>(prompt);

    return result;
  }

  /**
   * Analyze disease prevalence from medical records
   */
  async analyzeDiseasePrevalence(days: number = 90): Promise<Array<{
    condition: string;
    count: number;
    percentage: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    affectedDemographics: string[];
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await db.medicalRecords
      .where('visitDate')
      .above(startDate)
      .toArray();

    if (records.length === 0) {
      return Promise.resolve([]);
    }

    // Get patient demographics for affected patients
    const patientIds = [...new Set(records.map(r => r.patientId))];
    const patients = await Promise.all(
      patientIds.map(id => db.patients.get(id))
    );

    const prompt = `
Analyze disease prevalence from medical records:

Medical Records (Last ${days} Days):
Total Records: ${records.length}

Diagnoses:
${records.map(r => r.diagnosis).filter(d => d).join('\n')}

Patient Demographics:
${patients.filter(p => p).map(p => `Age: ${p!.age}, Gender: ${p!.gender}`).join('\n')}

Identify:
1. Most common conditions/diagnoses
2. Prevalence percentage
3. Trend (increasing, stable, or decreasing)
4. Affected demographics (age groups, gender)

Return JSON array:
[
  {
    "condition": "condition name",
    "count": number,
    "percentage": number,
    "trend": "increasing|stable|decreasing",
    "affectedDemographics": ["demographic1", "demographic2"]
  }
]

Sort by count descending.
Return ONLY the JSON array, no additional text.
`;

    const prevalence = await this.gemini.generateJSON<Array<{
      condition: string;
      count: number;
      percentage: number;
      trend: 'increasing' | 'stable' | 'decreasing';
      affectedDemographics: string[];
    }>>(prompt);

    return Promise.resolve(prevalence);
  }

  /**
   * Suggest products for a specific medical condition
   */
  async suggestProductsForCondition(condition: string): Promise<Array<{
    product: Product;
    relevanceScore: number;
    reasoning: string;
  }>> {
    const products = await db.products.where('isActive').equals(1 as any).toArray();

    const prompt = `
Suggest relevant medical products for treating or managing this condition:

Condition: ${condition}

Available Products:
${products.map(p => `- ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Description: ${p.description}`).join('\n')}

For each relevant product, provide:
- Product ID
- Relevance score (0-100)
- Reasoning for recommendation

Return JSON array:
[
  {
    "productId": "id",
    "relevanceScore": number (0-100),
    "reasoning": "why this product is relevant"
  }
]

Sort by relevance score descending.
Return ONLY the JSON array, no additional text.
`;

    const suggestions = await this.gemini.generateJSON<Array<{
      productId: string;
      relevanceScore: number;
      reasoning: string;
    }>>(prompt);

    // Map to full product objects
    const suggestionsWithProducts = suggestions
      .map(sug => {
        const product = products.find(p => p.id === sug.productId);
        if (!product) return null;

        return {
          product,
          relevanceScore: sug.relevanceScore,
          reasoning: sug.reasoning,
        };
      })
      .filter(s => s !== null) as Array<{
        product: Product;
        relevanceScore: number;
        reasoning: string;
      }>;

    return suggestionsWithProducts;
  }

  /**
   * Generate compliance report for regulatory requirements
   */
  async generateComplianceReport(): Promise<{
    compliant: boolean;
    issues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      affectedRecords: number;
      recommendation: string;
    }>;
    summary: string;
  }> {
    const [records, products] = await Promise.all([
      db.medicalRecords.toArray(),
      db.products.toArray(),
    ]);

    const prompt = `
Review medical records and product data for regulatory compliance:

Medical Records: ${records.length} total
Products: ${products.length} total

Sample Records:
${records.slice(0, 20).map(r => `
- Record Type: ${r.recordType}
- Has Diagnosis: ${!!r.diagnosis}
- Has Medications: ${!!r.medications && r.medications.length > 0}
- Has Doctor Name: ${!!r.doctorName}
- Has Hospital: ${!!r.hospitalName}
`).join('\n')}

Sample Products:
${products.slice(0, 20).map(p => `
- Name: ${p.name}
- Has Regulatory Info: ${!!p.regulatoryInfo}
- Has Expiry Date: ${!!p.expiryDate}
- Has Batch Number: ${!!p.batchNumber}
`).join('\n')}

Check for compliance issues:
1. Missing required fields in medical records
2. Products without regulatory information
3. Expired products still active
4. Missing documentation

Return JSON format:
{
  "compliant": boolean,
  "issues": [
    {
      "type": "issue type",
      "severity": "low|medium|high",
      "description": "what's wrong",
      "affectedRecords": number,
      "recommendation": "how to fix"
    }
  ],
  "summary": "overall compliance summary"
}

Return ONLY the JSON object, no additional text.
`;

    const report = await this.gemini.generateJSON<{
      compliant: boolean;
      issues: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high';
        description: string;
        affectedRecords: number;
        recommendation: string;
      }>;
      summary: string;
    }>(prompt);

    return report;
  }
}
