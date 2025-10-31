// AI-Powered Document Generation Service
// Automatically generates contracts, agreements, reports with AI-powered content

import { getGeminiService } from './client';
import { db } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Document template interface
 */
export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'contract' | 'agreement' | 'report' | 'invoice' | 'proposal' | 'letter';
  category: string;
  description: string;
  template: string; // Template with placeholders
  requiredFields: string[];
  language: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generated document interface
 */
export interface GeneratedDocument {
  id: string;
  templateId: string;
  templateName: string;
  type: string;
  content: string;
  metadata: {
    generatedBy: string;
    generatedAt: Date;
    language: string;
    wordCount: number;
    confidence: number;
  };
  data: any; // Input data used for generation
  format: 'html' | 'markdown' | 'plain';
}

/**
 * Document generation options
 */
interface GenerationOptions {
  language?: string;
  tone?: 'formal' | 'casual' | 'professional' | 'friendly';
  length?: 'short' | 'medium' | 'long';
  includeDisclaimer?: boolean;
  customInstructions?: string;
}

/**
 * AI-Powered Document Generation Service
 */
export class DocumentGenerationService {
  private gemini = getGeminiService();
  private templates: Map<string, DocumentTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default document templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Supplier Agreement',
        type: 'agreement',
        category: 'supply-chain',
        description: 'Standard supplier agreement for medical products',
        template: `SUPPLIER AGREEMENT

This Agreement is entered into on {{date}} between:

COMPANY: {{companyName}}
Address: {{companyAddress}}

SUPPLIER: {{supplierName}}
Address: {{supplierAddress}}

TERMS AND CONDITIONS:
{{terms}}

PAYMENT TERMS:
{{paymentTerms}}

DELIVERY TERMS:
{{deliveryTerms}}

QUALITY STANDARDS:
{{qualityStandards}}

SIGNATURES:
_________________          _________________
Company Representative     Supplier Representative`,
        requiredFields: ['companyName', 'companyAddress', 'supplierName', 'supplierAddress', 'terms', 'paymentTerms', 'deliveryTerms', 'qualityStandards'],
        language: 'en',
        isActive: true,
      },
      {
        name: 'Sales Contract',
        type: 'contract',
        category: 'sales',
        description: 'Sales contract for medical products',
        template: `SALES CONTRACT

Contract Number: {{contractNumber}}
Date: {{date}}

SELLER: {{sellerName}}
BUYER: {{buyerName}}

PRODUCTS:
{{productList}}

TOTAL AMOUNT: {{totalAmount}}

PAYMENT TERMS: {{paymentTerms}}

DELIVERY: {{deliveryTerms}}

WARRANTIES: {{warranties}}

SIGNATURES:
_________________          _________________
Seller                     Buyer`,
        requiredFields: ['contractNumber', 'sellerName', 'buyerName', 'productList', 'totalAmount', 'paymentTerms', 'deliveryTerms', 'warranties'],
        language: 'en',
        isActive: true,
      },
      {
        name: 'Monthly Sales Report',
        type: 'report',
        category: 'analytics',
        description: 'Comprehensive monthly sales performance report',
        template: `MONTHLY SALES REPORT

Period: {{period}}
Generated: {{generatedDate}}

EXECUTIVE SUMMARY:
{{executiveSummary}}

KEY METRICS:
{{keyMetrics}}

SALES ANALYSIS:
{{salesAnalysis}}

TOP PRODUCTS:
{{topProducts}}

CUSTOMER INSIGHTS:
{{customerInsights}}

RECOMMENDATIONS:
{{recommendations}}`,
        requiredFields: ['period', 'executiveSummary', 'keyMetrics', 'salesAnalysis', 'topProducts', 'customerInsights', 'recommendations'],
        language: 'en',
        isActive: true,
      },
      {
        name: 'Employment Contract',
        type: 'contract',
        category: 'hr',
        description: 'Standard employment contract',
        template: `EMPLOYMENT CONTRACT

This Employment Contract is entered into on {{date}} between:

EMPLOYER: {{companyName}}
EMPLOYEE: {{employeeName}}

POSITION: {{position}}
DEPARTMENT: {{department}}

START DATE: {{startDate}}
CONTRACT TYPE: {{contractType}}

SALARY: {{salary}}
BENEFITS: {{benefits}}

RESPONSIBILITIES:
{{responsibilities}}

TERMS AND CONDITIONS:
{{terms}}

SIGNATURES:
_________________          _________________
Employer                   Employee`,
        requiredFields: ['companyName', 'employeeName', 'position', 'department', 'startDate', 'contractType', 'salary', 'benefits', 'responsibilities', 'terms'],
        language: 'en',
        isActive: true,
      },
      {
        name: 'Business Proposal',
        type: 'proposal',
        category: 'sales',
        description: 'Professional business proposal',
        template: `BUSINESS PROPOSAL

To: {{recipientName}}
From: {{senderName}}
Date: {{date}}
Subject: {{subject}}

EXECUTIVE SUMMARY:
{{executiveSummary}}

PROBLEM STATEMENT:
{{problemStatement}}

PROPOSED SOLUTION:
{{proposedSolution}}

BENEFITS:
{{benefits}}

PRICING:
{{pricing}}

TIMELINE:
{{timeline}}

NEXT STEPS:
{{nextSteps}}`,
        requiredFields: ['recipientName', 'senderName', 'subject', 'executiveSummary', 'problemStatement', 'proposedSolution', 'benefits', 'pricing', 'timeline', 'nextSteps'],
        language: 'en',
        isActive: true,
      },
    ];

    defaultTemplates.forEach(template => {
      const fullTemplate: DocumentTemplate = {
        ...template,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.templates.set(fullTemplate.id, fullTemplate);
    });
  }

  /**
   * Generate document from template with AI-powered content
   */
  async generateDocument(
    templateId: string,
    data: any,
    options: GenerationOptions = {}
  ): Promise<GeneratedDocument> {
    const template = this.templates.get(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate required fields
    const missingFields = template.requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Use AI to enhance and fill content
    const enhancedData = await this.enhanceContentWithAI(template, data, options);

    // Fill template with enhanced data
    let content = template.template;
    Object.entries(enhancedData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Add disclaimer if requested
    if (options.includeDisclaimer) {
      content += '\n\n---\nDISCLAIMER: This document was generated automatically. Please review carefully before use.';
    }

    const generatedDoc: GeneratedDocument = {
      id: uuidv4(),
      templateId: template.id,
      templateName: template.name,
      type: template.type,
      content,
      metadata: {
        generatedBy: 'AI Document Generator',
        generatedAt: new Date(),
        language: options.language || template.language,
        wordCount: content.split(/\s+/).length,
        confidence: 0.95,
      },
      data: enhancedData,
      format: 'plain',
    };

    // Log generation
    await this.logGeneration(generatedDoc);

    return generatedDoc;
  }

  /**
   * Enhance content with AI
   */
  private async enhanceContentWithAI(
    template: DocumentTemplate,
    data: any,
    options: GenerationOptions
  ): Promise<any> {
    const enhancedData = { ...data };

    // Add current date if not provided
    if (!enhancedData.date) {
      enhancedData.date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    if (!enhancedData.generatedDate) {
      enhancedData.generatedDate = enhancedData.date;
    }

    // Use AI to generate missing or enhance existing content
    for (const field of template.requiredFields) {
      if (!data[field] || data[field] === 'AI_GENERATE') {
        enhancedData[field] = await this.generateFieldContent(
          template,
          field,
          data,
          options
        );
      }
    }

    return enhancedData;
  }

  /**
   * Generate content for a specific field using AI
   */
  private async generateFieldContent(
    template: DocumentTemplate,
    field: string,
    context: any,
    options: GenerationOptions
  ): Promise<string> {
    const prompt = `Generate professional content for a ${template.type} document.

Template: ${template.name}
Field: ${field}
Context: ${JSON.stringify(context, null, 2)}

Requirements:
- Language: ${options.language || 'English'}
- Tone: ${options.tone || 'professional'}
- Length: ${options.length || 'medium'}
${options.customInstructions ? `- Additional instructions: ${options.customInstructions}` : ''}

Generate appropriate content for the "${field}" field that fits the context and maintains a ${options.tone || 'professional'} tone.
Ensure the content is relevant, accurate, and complies with standard business practices.

Respond with ONLY the content for this field, no explanations or additional text.`;

    try {
      const content = await this.gemini.generateContent(prompt, false);
      return content.trim();
    } catch (error) {
      console.error(`Failed to generate content for field ${field}:`, error);
      return `[Content for ${field}]`;
    }
  }

  /**
   * Generate document from scratch using AI
   */
  async generateFromScratch(
    type: string,
    description: string,
    data: any,
    options: GenerationOptions = {}
  ): Promise<GeneratedDocument> {
    const prompt = `Generate a complete ${type} document based on the following:

Description: ${description}
Data: ${JSON.stringify(data, null, 2)}

Requirements:
- Language: ${options.language || 'English'}
- Tone: ${options.tone || 'professional'}
- Length: ${options.length || 'medium'}
- Format: Professional business document
${options.customInstructions ? `- Additional instructions: ${options.customInstructions}` : ''}

Generate a complete, professional ${type} that includes:
1. Proper heading and title
2. All necessary sections
3. Professional formatting
4. Appropriate legal language (if applicable)
5. Signature lines (if applicable)

Ensure the document is comprehensive, accurate, and follows industry standards.`;

    try {
      const content = await this.gemini.generateContent(prompt, false);

      const generatedDoc: GeneratedDocument = {
        id: uuidv4(),
        templateId: 'custom',
        templateName: `Custom ${type}`,
        type,
        content: content.trim(),
        metadata: {
          generatedBy: 'AI Document Generator',
          generatedAt: new Date(),
          language: options.language || 'en',
          wordCount: content.split(/\s+/).length,
          confidence: 0.85,
        },
        data,
        format: 'plain',
      };

      await this.logGeneration(generatedDoc);

      return generatedDoc;
    } catch (error) {
      console.error('Failed to generate document from scratch:', error);
      throw error;
    }
  }

  /**
   * Translate document to another language
   */
  async translateDocument(
    documentId: string,
    targetLanguage: string
  ): Promise<GeneratedDocument> {
    // This would retrieve the document and translate it
    // For now, we'll create a placeholder implementation
    throw new Error('Translation not yet implemented');
  }

  /**
   * Review and improve document with AI
   */
  async reviewDocument(content: string): Promise<{
    improvedContent: string;
    suggestions: string[];
    issues: string[];
    confidence: number;
  }> {
    const prompt = `Review and improve the following document:

${content}

Provide:
1. Improved version with better clarity, grammar, and professionalism
2. List of suggestions for further improvement
3. List of any issues found (legal, grammatical, structural)
4. Confidence score (0-1) for the quality of the document

Respond in JSON format:
{
  "improvedContent": "...",
  "suggestions": ["...", "..."],
  "issues": ["...", "..."],
  "confidence": 0.95
}`;

    try {
      const response = await this.gemini.generateJSON<{
        improvedContent: string;
        suggestions: string[];
        issues: string[];
        confidence: number;
      }>(prompt, false);

      return response;
    } catch (error) {
      console.error('Failed to review document:', error);
      throw error;
    }
  }

  /**
   * Get all available templates
   */
  getTemplates(category?: string): DocumentTemplate[] {
    const templates = Array.from(this.templates.values());
    
    if (category) {
      return templates.filter(t => t.category === category && t.isActive);
    }
    
    return templates.filter(t => t.isActive);
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): DocumentTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Add custom template
   */
  addTemplate(template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): DocumentTemplate {
    const newTemplate: DocumentTemplate = {
      ...template,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  /**
   * Update template
   */
  updateTemplate(templateId: string, updates: Partial<DocumentTemplate>): DocumentTemplate {
    const template = this.templates.get(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const updatedTemplate: DocumentTemplate = {
      ...template,
      ...updates,
      id: template.id,
      createdAt: template.createdAt,
      updatedAt: new Date(),
    };

    this.templates.set(templateId, updatedTemplate);
    return updatedTemplate;
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): void {
    this.templates.delete(templateId);
  }

  /**
   * Export document to different formats
   */
  async exportDocument(
    document: GeneratedDocument,
    format: 'pdf' | 'docx' | 'html' | 'markdown'
  ): Promise<Blob> {
    // This would use a library to convert to the desired format
    // For now, return as text blob
    const blob = new Blob([document.content], { type: 'text/plain' });
    return blob;
  }

  /**
   * Log document generation
   */
  private async logGeneration(document: GeneratedDocument): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action: 'document_generated',
        entityType: 'document',
        entityId: document.id,
        details: JSON.stringify({
          templateName: document.templateName,
          type: document.type,
          wordCount: document.metadata.wordCount,
          language: document.metadata.language,
        }),
        userId: 'system',
        timestamp: new Date(),
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to log document generation:', error);
    }
  }

  /**
   * Get generation analytics
   */
  async getAnalytics(days: number = 30): Promise<{
    totalGenerated: number;
    byType: Record<string, number>;
    byTemplate: Record<string, number>;
    averageWordCount: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await db.systemLogs
      .where('action')
      .equals('document_generated')
      .and(log => log.timestamp >= startDate)
      .toArray();

    const byType: Record<string, number> = {};
    const byTemplate: Record<string, number> = {};
    let totalWordCount = 0;

    logs.forEach(log => {
      const details = JSON.parse(log.details);
      
      byType[details.type] = (byType[details.type] || 0) + 1;
      byTemplate[details.templateName] = (byTemplate[details.templateName] || 0) + 1;
      totalWordCount += details.wordCount || 0;
    });

    return {
      totalGenerated: logs.length,
      byType,
      byTemplate,
      averageWordCount: logs.length > 0 ? totalWordCount / logs.length : 0,
    };
  }
}

// Export singleton instance
let documentGenerationServiceInstance: DocumentGenerationService | null = null;

export function getDocumentGenerationService(): DocumentGenerationService {
  if (!documentGenerationServiceInstance) {
    documentGenerationServiceInstance = new DocumentGenerationService();
  }
  return documentGenerationServiceInstance;
}
