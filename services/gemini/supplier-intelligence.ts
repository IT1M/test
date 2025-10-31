// AI-Powered Supplier Intelligence Service

import { GeminiService } from './client';
import { SupplierService } from '../database/suppliers';
import type { Supplier, SupplierEvaluation } from '@/types/database';

/**
 * Supplier Intelligence Service - AI-powered supplier analysis and recommendations
 */
export class SupplierIntelligenceService {
  /**
   * Analyze supplier performance and provide insights
   */
  static async analyzeSupplierPerformance(supplierId: string): Promise<{
    overallAssessment: string;
    strengths: string[];
    weaknesses: string[];
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
    confidence: number;
  }> {
    try {
      const summary = await SupplierService.getSupplierPerformanceSummary(supplierId);
      const supplier = summary.supplier;
      const evaluations = await SupplierService.getSupplierEvaluations(supplierId);

      const prompt = `Analyze this supplier's performance data and provide insights:

Supplier: ${supplier.name}
Type: ${supplier.type}
Rating: ${supplier.rating}/5
Overall Score: ${supplier.overallScore}%

Performance Scores:
- Quality: ${supplier.qualityScore}%
- Delivery: ${supplier.deliveryScore}%
- Price: ${supplier.priceScore}%

Average Scores from ${evaluations.length} evaluations:
- Quality: ${summary.averageScores.quality.toFixed(1)}%
- Delivery: ${summary.averageScores.delivery.toFixed(1)}%
- Price: ${summary.averageScores.price.toFixed(1)}%
- Service: ${summary.averageScores.service.toFixed(1)}%
- Compliance: ${summary.averageScores.compliance.toFixed(1)}%

Lead Time: ${supplier.leadTime} days
Payment Terms: ${supplier.paymentTerms}
Active Contracts: ${summary.activeContracts}
Certifications: ${supplier.certifications?.join(', ') || 'None'}

${evaluations.length > 0 ? `
Recent Evaluation Feedback:
${evaluations.slice(0, 3).map(e => `
- Period: ${e.period}
  Strengths: ${e.strengths?.join(', ') || 'None'}
  Weaknesses: ${e.weaknesses?.join(', ') || 'None'}
  Recommendations: ${e.recommendations?.join(', ') || 'None'}
`).join('\n')}
` : ''}

Provide a comprehensive analysis in JSON format:
{
  "overallAssessment": "Brief overall assessment of the supplier",
  "strengths": ["List of key strengths"],
  "weaknesses": ["List of areas needing improvement"],
  "riskLevel": "low|medium|high",
  "recommendations": ["Specific actionable recommendations"],
  "confidence": 0.0-1.0
}`;

      const response = await GeminiService.generateText(prompt);
      const analysis = JSON.parse(response);

      return analysis;
    } catch (error) {
      console.error('Error analyzing supplier performance:', error);
      throw error;
    }
  }

  /**
   * Recommend optimal suppliers for a specific product
   */
  static async recommendSuppliersForProduct(
    productId: string,
    productName: string,
    productCategory: string,
    requirements?: {
      maxLeadTime?: number;
      minQualityScore?: number;
      preferredCountries?: string[];
      maxPrice?: number;
    }
  ): Promise<{
    recommendations: Array<{
      supplier: Supplier;
      score: number;
      reasoning: string;
      pros: string[];
      cons: string[];
    }>;
    analysis: string;
  }> {
    try {
      // Get all active suppliers
      const allSuppliers = await SupplierService.getActiveSuppliers();
      
      // Filter suppliers that supply this product or similar products
      const relevantSuppliers = allSuppliers.filter(s => 
        s.suppliedProducts?.includes(productId) || 
        s.type === 'manufacturer' || 
        s.type === 'distributor'
      );

      // Apply requirement filters
      let filteredSuppliers = relevantSuppliers;
      
      if (requirements?.maxLeadTime) {
        filteredSuppliers = filteredSuppliers.filter(s => s.leadTime <= requirements.maxLeadTime!);
      }
      
      if (requirements?.minQualityScore) {
        filteredSuppliers = filteredSuppliers.filter(s => s.qualityScore >= requirements.minQualityScore!);
      }
      
      if (requirements?.preferredCountries && requirements.preferredCountries.length > 0) {
        filteredSuppliers = filteredSuppliers.filter(s => 
          requirements.preferredCountries!.includes(s.country)
        );
      }

      const prompt = `Analyze and rank these suppliers for sourcing the following product:

Product: ${productName}
Category: ${productCategory}
Product ID: ${productId}

Requirements:
${requirements?.maxLeadTime ? `- Maximum Lead Time: ${requirements.maxLeadTime} days` : ''}
${requirements?.minQualityScore ? `- Minimum Quality Score: ${requirements.minQualityScore}%` : ''}
${requirements?.preferredCountries ? `- Preferred Countries: ${requirements.preferredCountries.join(', ')}` : ''}

Available Suppliers:
${filteredSuppliers.map((s, idx) => `
${idx + 1}. ${s.name} (${s.supplierId})
   - Type: ${s.type}
   - Rating: ${s.rating}/5
   - Quality Score: ${s.qualityScore}%
   - Delivery Score: ${s.deliveryScore}%
   - Price Score: ${s.priceScore}%
   - Lead Time: ${s.leadTime} days
   - Payment Terms: ${s.paymentTerms}
   - Country: ${s.country}
   - Preferred: ${s.isPreferred ? 'Yes' : 'No'}
   - Certifications: ${s.certifications?.join(', ') || 'None'}
`).join('\n')}

Rank the suppliers and provide recommendations in JSON format:
{
  "recommendations": [
    {
      "supplierId": "supplier ID",
      "score": 0-100,
      "reasoning": "Why this supplier is recommended",
      "pros": ["List of advantages"],
      "cons": ["List of disadvantages"]
    }
  ],
  "analysis": "Overall analysis and recommendation summary"
}

Rank by overall suitability considering quality, reliability, price, and lead time.`;

      const response = await GeminiService.generateText(prompt);
      const result = JSON.parse(response);

      // Map supplier IDs to full supplier objects
      const recommendations = result.recommendations.map((rec: any) => {
        const supplier = filteredSuppliers.find(s => s.supplierId === rec.supplierId);
        return {
          supplier: supplier!,
          score: rec.score,
          reasoning: rec.reasoning,
          pros: rec.pros,
          cons: rec.cons,
        };
      }).filter((rec: any) => rec.supplier); // Filter out any not found

      return {
        recommendations,
        analysis: result.analysis,
      };
    } catch (error) {
      console.error('Error recommending suppliers:', error);
      throw error;
    }
  }

  /**
   * Predict supplier reliability and risk
   */
  static async predictSupplierReliability(supplierId: string): Promise<{
    reliabilityScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
    predictions: {
      qualityTrend: 'improving' | 'stable' | 'declining';
      deliveryTrend: 'improving' | 'stable' | 'declining';
      overallTrend: 'improving' | 'stable' | 'declining';
    };
    recommendations: string[];
    confidence: number;
  }> {
    try {
      const summary = await SupplierService.getSupplierPerformanceSummary(supplierId);
      const supplier = summary.supplier;
      const evaluations = await SupplierService.getSupplierEvaluations(supplierId);

      // Calculate trends from evaluations
      const qualityTrend = this.calculateTrend(evaluations.map(e => e.qualityScore));
      const deliveryTrend = this.calculateTrend(evaluations.map(e => e.deliveryScore));
      const overallTrend = this.calculateTrend(evaluations.map(e => e.overallScore));

      const prompt = `Predict the reliability and risk level of this supplier based on historical performance:

Supplier: ${supplier.name}
Current Rating: ${supplier.rating}/5
Overall Score: ${supplier.overallScore}%

Current Performance:
- Quality: ${supplier.qualityScore}%
- Delivery: ${supplier.deliveryScore}%
- Price: ${supplier.priceScore}%

Historical Evaluations (${evaluations.length} total):
${evaluations.slice(0, 5).map((e, idx) => `
${idx + 1}. ${e.period}
   - Overall: ${e.overallScore}%
   - Quality: ${e.qualityScore}%
   - Delivery: ${e.deliveryScore}%
   - Compliance: ${e.complianceScore}%
   ${e.weaknesses?.length ? `- Issues: ${e.weaknesses.join(', ')}` : ''}
`).join('\n')}

Observed Trends:
- Quality: ${qualityTrend}
- Delivery: ${deliveryTrend}
- Overall: ${overallTrend}

Business Details:
- Lead Time: ${supplier.leadTime} days
- Active Contracts: ${summary.activeContracts}
- Certifications: ${supplier.certifications?.join(', ') || 'None'}
- Insurance Expiry: ${supplier.insuranceExpiry ? new Date(supplier.insuranceExpiry).toLocaleDateString() : 'Not specified'}

Analyze the data and predict future reliability in JSON format:
{
  "reliabilityScore": 0-100,
  "riskLevel": "low|medium|high|critical",
  "riskFactors": ["List of identified risk factors"],
  "predictions": {
    "qualityTrend": "improving|stable|declining",
    "deliveryTrend": "improving|stable|declining",
    "overallTrend": "improving|stable|declining"
  },
  "recommendations": ["Specific actions to mitigate risks"],
  "confidence": 0.0-1.0
}`;

      const response = await GeminiService.generateText(prompt);
      const prediction = JSON.parse(response);

      return prediction;
    } catch (error) {
      console.error('Error predicting supplier reliability:', error);
      throw error;
    }
  }

  /**
   * Suggest alternative suppliers
   */
  static async suggestAlternativeSuppliers(
    currentSupplierId: string,
    reason: 'quality' | 'price' | 'delivery' | 'risk' | 'diversification'
  ): Promise<{
    alternatives: Array<{
      supplier: Supplier;
      score: number;
      advantages: string[];
      considerations: string[];
    }>;
    analysis: string;
  }> {
    try {
      const currentSupplier = await SupplierService.getSupplierById(currentSupplierId);
      if (!currentSupplier) throw new Error('Current supplier not found');

      const allSuppliers = await SupplierService.getActiveSuppliers();
      const alternatives = allSuppliers.filter(s => 
        s.id !== currentSupplierId && 
        s.type === currentSupplier.type
      );

      const prompt = `Suggest alternative suppliers to replace or complement the current supplier:

Current Supplier: ${currentSupplier.name}
Reason for Seeking Alternatives: ${reason}

Current Supplier Details:
- Type: ${currentSupplier.type}
- Rating: ${currentSupplier.rating}/5
- Quality: ${currentSupplier.qualityScore}%
- Delivery: ${currentSupplier.deliveryScore}%
- Price: ${currentSupplier.priceScore}%
- Lead Time: ${currentSupplier.leadTime} days
- Country: ${currentSupplier.country}

Alternative Suppliers:
${alternatives.slice(0, 10).map((s, idx) => `
${idx + 1}. ${s.name}
   - Rating: ${s.rating}/5
   - Quality: ${s.qualityScore}%
   - Delivery: ${s.deliveryScore}%
   - Price: ${s.priceScore}%
   - Lead Time: ${s.leadTime} days
   - Country: ${s.country}
   - Preferred: ${s.isPreferred ? 'Yes' : 'No'}
`).join('\n')}

Recommend the best alternatives in JSON format:
{
  "alternatives": [
    {
      "supplierId": "supplier ID",
      "score": 0-100,
      "advantages": ["Why this is a good alternative"],
      "considerations": ["Things to consider before switching"]
    }
  ],
  "analysis": "Overall recommendation and strategy"
}

Focus on addressing the specific reason: ${reason}`;

      const response = await GeminiService.generateText(prompt);
      const result = JSON.parse(response);

      const alternativesWithSuppliers = result.alternatives.map((alt: any) => {
        const supplier = alternatives.find(s => s.supplierId === alt.supplierId);
        return {
          supplier: supplier!,
          score: alt.score,
          advantages: alt.advantages,
          considerations: alt.considerations,
        };
      }).filter((alt: any) => alt.supplier);

      return {
        alternatives: alternativesWithSuppliers,
        analysis: result.analysis,
      };
    } catch (error) {
      console.error('Error suggesting alternative suppliers:', error);
      throw error;
    }
  }

  /**
   * Optimize supplier portfolio
   */
  static async optimizeSupplierPortfolio(): Promise<{
    currentState: {
      totalSuppliers: number;
      preferredSuppliers: number;
      averageRating: number;
      riskDistribution: Record<string, number>;
    };
    recommendations: {
      suppliersToPromote: Array<{ supplier: Supplier; reason: string }>;
      suppliersToDemote: Array<{ supplier: Supplier; reason: string }>;
      suppliersToReview: Array<{ supplier: Supplier; reason: string }>;
      diversificationNeeds: string[];
    };
    analysis: string;
  }> {
    try {
      const allSuppliers = await SupplierService.getSuppliers();
      const stats = await SupplierService.getSupplierStats();

      // Analyze each supplier's risk
      const supplierRisks = await Promise.all(
        allSuppliers.slice(0, 20).map(async s => {
          try {
            const risk = await this.predictSupplierReliability(s.id);
            return { supplier: s, risk: risk.riskLevel };
          } catch {
            return { supplier: s, risk: 'medium' as const };
          }
        })
      );

      const prompt = `Analyze the supplier portfolio and provide optimization recommendations:

Current Portfolio:
- Total Suppliers: ${stats.total}
- Active Suppliers: ${stats.active}
- Preferred Suppliers: ${stats.preferred}
- Average Rating: ${stats.averageRating.toFixed(2)}/5

Supplier Distribution:
${Object.entries(stats.byType).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

Geographic Distribution:
${Object.entries(stats.byCountry).slice(0, 5).map(([country, count]) => `- ${country}: ${count}`).join('\n')}

Top Performers (Rating >= 4.0):
${allSuppliers.filter(s => s.rating >= 4.0).slice(0, 5).map(s => 
  `- ${s.name}: ${s.rating}/5 (Quality: ${s.qualityScore}%, Delivery: ${s.deliveryScore}%)`
).join('\n')}

Underperformers (Rating < 3.0):
${allSuppliers.filter(s => s.rating < 3.0).slice(0, 5).map(s => 
  `- ${s.name}: ${s.rating}/5 (Quality: ${s.qualityScore}%, Delivery: ${s.deliveryScore}%)`
).join('\n')}

Risk Distribution:
${supplierRisks.reduce((acc, sr) => {
  acc[sr.risk] = (acc[sr.risk] || 0) + 1;
  return acc;
}, {} as Record<string, number>)}

Provide portfolio optimization recommendations in JSON format:
{
  "recommendations": {
    "suppliersToPromote": [
      {"supplierId": "ID", "reason": "Why promote to preferred"}
    ],
    "suppliersToDemote": [
      {"supplierId": "ID", "reason": "Why remove from preferred"}
    ],
    "suppliersToReview": [
      {"supplierId": "ID", "reason": "Why needs review"}
    ],
    "diversificationNeeds": ["Areas where supplier diversity is needed"]
  },
  "analysis": "Overall portfolio health and strategic recommendations"
}`;

      const response = await GeminiService.generateText(prompt);
      const result = JSON.parse(response);

      // Map supplier IDs to full objects
      const mapSuppliers = (items: any[]) => items.map((item: any) => {
        const supplier = allSuppliers.find(s => s.supplierId === item.supplierId);
        return supplier ? { supplier, reason: item.reason } : null;
      }).filter(Boolean);

      return {
        currentState: {
          totalSuppliers: stats.total,
          preferredSuppliers: stats.preferred,
          averageRating: stats.averageRating,
          riskDistribution: supplierRisks.reduce((acc, sr) => {
            acc[sr.risk] = (acc[sr.risk] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
        recommendations: {
          suppliersToPromote: mapSuppliers(result.recommendations.suppliersToPromote),
          suppliersToDemote: mapSuppliers(result.recommendations.suppliersToDemote),
          suppliersToReview: mapSuppliers(result.recommendations.suppliersToReview),
          diversificationNeeds: result.recommendations.diversificationNeeds,
        },
        analysis: result.analysis,
      };
    } catch (error) {
      console.error('Error optimizing supplier portfolio:', error);
      throw error;
    }
  }

  /**
   * Calculate trend from historical data
   */
  private static calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable';

    const recent = values.slice(0, Math.min(3, values.length));
    const older = values.slice(Math.min(3, values.length));

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const diff = recentAvg - olderAvg;

    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }
}
