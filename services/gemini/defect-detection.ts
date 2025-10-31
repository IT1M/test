// AI-Powered Defect Detection Service using Gemini Vision API

import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db/schema';
import type { Rejection, RejectionImage } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export interface DefectAnalysisResult {
  defectType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  suggestedRejectionReason: string;
  description: string;
  suggestedActions: string[];
  similarCases: string[];
}

/**
 * Analyze defect images using Gemini Vision API
 */
export async function analyzeDefectImages(
  images: RejectionImage[],
  itemCode: string,
  context?: {
    productName?: string;
    batchNumber?: string;
    machineName?: string;
  }
): Promise<DefectAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Prepare image data for Gemini
    const imageParts = images.map(img => ({
      inlineData: {
        data: img.url.split(',')[1], // Remove data:image/jpeg;base64, prefix
        mimeType: 'image/jpeg',
      },
    }));

    const prompt = `You are a quality control expert analyzing product defects. 

Analyze the provided images of a rejected product and provide a detailed assessment.

Product Information:
- Item Code: ${itemCode}
${context?.productName ? `- Product Name: ${context.productName}` : ''}
${context?.batchNumber ? `- Batch Number: ${context.batchNumber}` : ''}
${context?.machineName ? `- Machine: ${context.machineName}` : ''}

Please analyze the defect(s) and provide:
1. Defect Type: Categorize as cosmetic, functional, safety, or documentation issue
2. Severity: Rate as low, medium, high, or critical
3. Confidence: Your confidence level (0-100%)
4. Suggested Rejection Reason: A clear, concise reason for rejection
5. Description: Detailed description of the defect(s) observed
6. Suggested Actions: 3-5 corrective actions to prevent future occurrences
7. Root Cause: Potential root cause of the defect

Format your response as JSON:
{
  "defectType": "cosmetic|functional|safety|documentation",
  "severity": "low|medium|high|critical",
  "confidence": 85,
  "suggestedRejectionReason": "Brief reason",
  "description": "Detailed description",
  "suggestedActions": ["Action 1", "Action 2", "Action 3"],
  "rootCause": "Potential root cause"
}`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Find similar historical cases
    const similarCases = await findSimilarRejections(analysis.defectType, itemCode);

    // Log the AI analysis
    await db.systemLogs.add({
      id: uuidv4(),
      action: 'AI_DEFECT_ANALYSIS',
      entityType: 'rejection',
      details: `Analyzed defect for ${itemCode}: ${analysis.defectType} (${analysis.severity})`,
      userId: 'system',
      timestamp: new Date(),
      status: 'success',
    });

    return {
      ...analysis,
      similarCases: similarCases.map(r => r.rejectionId),
    };
  } catch (error) {
    console.error('Error analyzing defect images:', error);
    
    // Log the error
    await db.systemLogs.add({
      id: uuidv4(),
      action: 'AI_DEFECT_ANALYSIS',
      entityType: 'rejection',
      details: `Failed to analyze defect for ${itemCode}`,
      userId: 'system',
      timestamp: new Date(),
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Categorize defect type automatically
 */
export async function categorizeDefectType(
  description: string,
  images?: RejectionImage[]
): Promise<'cosmetic' | 'functional' | 'safety' | 'documentation' | 'other'> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Categorize this product defect into one of these categories:
- cosmetic: Visual defects, scratches, discoloration, packaging issues
- functional: Product doesn't work as intended, performance issues
- safety: Safety hazards, potential harm to users
- documentation: Missing or incorrect documentation, labeling issues
- other: Doesn't fit other categories

Defect Description: ${description}

Respond with only one word: cosmetic, functional, safety, documentation, or other`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const category = response.text().trim().toLowerCase();

    if (['cosmetic', 'functional', 'safety', 'documentation', 'other'].includes(category)) {
      return category as any;
    }

    return 'other';
  } catch (error) {
    console.error('Error categorizing defect:', error);
    return 'other';
  }
}

/**
 * Generate defect severity score
 */
export async function generateSeverityScore(
  defectType: string,
  description: string,
  quantity: number,
  costImpact: number
): Promise<'low' | 'medium' | 'high' | 'critical'> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Assess the severity of this product defect:

Defect Type: ${defectType}
Description: ${description}
Quantity Affected: ${quantity}
Cost Impact: $${costImpact}

Rate the severity as:
- low: Minor cosmetic issues, no functional impact, low cost
- medium: Noticeable defects, minor functional impact, moderate cost
- high: Significant defects, major functional impact, high cost
- critical: Safety hazards, complete failure, very high cost

Respond with only one word: low, medium, high, or critical`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const severity = response.text().trim().toLowerCase();

    if (['low', 'medium', 'high', 'critical'].includes(severity)) {
      return severity as any;
    }

    // Default based on cost impact
    if (costImpact > 10000) return 'critical';
    if (costImpact > 5000) return 'high';
    if (costImpact > 1000) return 'medium';
    return 'low';
  } catch (error) {
    console.error('Error generating severity score:', error);
    
    // Fallback logic
    if (defectType === 'safety') return 'critical';
    if (costImpact > 10000) return 'critical';
    if (costImpact > 5000) return 'high';
    if (costImpact > 1000) return 'medium';
    return 'low';
  }
}

/**
 * Find similar historical rejections using AI pattern matching
 */
export async function findSimilarRejections(
  defectType: string,
  itemCode: string,
  limit: number = 5
): Promise<Rejection[]> {
  try {
    // Get all rejections for the same product
    const allRejections = await db.rejections
      .where('itemCode')
      .equals(itemCode)
      .toArray();

    // Filter by defect type
    const similarByType = allRejections.filter(r => r.rejectionType === defectType);

    // Sort by date (most recent first) and limit
    return similarByType
      .sort((a, b) => b.rejectionDate.getTime() - a.rejectionDate.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error finding similar rejections:', error);
    return [];
  }
}

/**
 * Suggest corrective actions based on defect pattern
 */
export async function suggestCorrectiveActions(
  rejection: Rejection,
  historicalData: Rejection[]
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const historicalContext = historicalData.length > 0
      ? `Historical rejections for this product:
${historicalData.map((r, i) => `${i + 1}. ${r.rejectionReason} (${r.rejectionType}, ${r.severity})`).join('\n')}`
      : 'No historical data available.';

    const prompt = `As a quality control expert, suggest corrective and preventive actions for this rejection:

Current Rejection:
- Item Code: ${rejection.itemCode}
- Defect Type: ${rejection.rejectionType}
- Severity: ${rejection.severity}
- Reason: ${rejection.rejectionReason}
- Machine: ${rejection.machineName}
- Batch: ${rejection.batchNumber}

${historicalContext}

Provide 5 specific, actionable corrective actions to prevent this defect from recurring. Focus on:
1. Immediate corrective action
2. Process improvement
3. Training/documentation
4. Equipment/tooling
5. Supplier/material quality

Format as a JSON array of strings:
["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON array
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [
        'Investigate root cause of defect',
        'Review and update quality control procedures',
        'Provide additional training to operators',
        'Inspect and maintain equipment',
        'Implement additional quality checks',
      ];
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error suggesting corrective actions:', error);
    return [
      'Investigate root cause of defect',
      'Review and update quality control procedures',
      'Provide additional training to operators',
      'Inspect and maintain equipment',
      'Implement additional quality checks',
    ];
  }
}

/**
 * Update rejection with AI analysis
 */
export async function updateRejectionWithAIAnalysis(
  rejectionId: string,
  images: RejectionImage[]
): Promise<void> {
  try {
    const rejection = await db.rejections.get(rejectionId);
    if (!rejection) {
      throw new Error('Rejection not found');
    }

    // Analyze images
    const analysis = await analyzeDefectImages(images, rejection.itemCode, {
      batchNumber: rejection.batchNumber,
      machineName: rejection.machineName,
    });

    // Get historical data
    const historicalData = await findSimilarRejections(
      analysis.defectType,
      rejection.itemCode
    );

    // Suggest corrective actions
    const suggestedActions = await suggestCorrectiveActions(rejection, historicalData);

    // Update rejection with AI analysis
    await db.rejections.update(rejectionId, {
      geminiAnalysis: {
        defectType: analysis.defectType,
        confidence: analysis.confidence,
        suggestedActions,
        similarCases: analysis.similarCases,
      },
      rejectionType: analysis.defectType as any,
      severity: analysis.severity,
      updatedAt: new Date(),
    });

    // Update images with analysis results
    const updatedImages = images.map(img => ({
      ...img,
      analysisResults: {
        defectType: analysis.defectType,
        severity: analysis.severity,
        confidence: analysis.confidence,
      },
    }));

    await db.rejections.update(rejectionId, {
      images: updatedImages,
    });
  } catch (error) {
    console.error('Error updating rejection with AI analysis:', error);
    throw error;
  }
}

/**
 * Batch analyze multiple rejections
 */
export async function batchAnalyzeRejections(
  rejectionIds: string[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const id of rejectionIds) {
    try {
      const rejection = await db.rejections.get(id);
      if (!rejection || rejection.images.length === 0) {
        failed++;
        errors.push(`${id}: No images available`);
        continue;
      }

      await updateRejectionWithAIAnalysis(id, rejection.images);
      success++;
    } catch (error) {
      failed++;
      errors.push(`${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { success, failed, errors };
}
