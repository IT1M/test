'use client';

// AI Document Generator Component
// Interface for generating documents using AI

import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  getDocumentGenerationService,
  DocumentTemplate,
  GeneratedDocument,
} from '@/services/gemini/document-generation';
import { toast } from 'react-hot-toast';

export function DocumentGenerator() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('template');
  
  const docService = getDocumentGenerationService();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const allTemplates = docService.getTemplates();
    setTemplates(allTemplates);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = docService.getTemplate(templateId);
    if (template) {
      setSelectedTemplate(template);
      // Initialize form data with empty values
      const initialData: Record<string, string> = {};
      template.requiredFields.forEach(field => {
        initialData[field] = '';
      });
      setFormData(initialData);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    setIsGenerating(true);

    try {
      const doc = await docService.generateDocument(
        selectedTemplate.id,
        formData,
        {
          tone: 'professional',
          includeDisclaimer: true,
        }
      );

      setGeneratedDoc(doc);
      setActiveTab('preview');
      toast.success('Document generated successfully!');
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedDoc) return;

    const blob = new Blob([generatedDoc.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedDoc.templateName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Document downloaded');
  };

  const formatFieldName = (field: string): string => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            AI Document Generator
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Generate professional documents automatically with AI
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="template">Select Template</TabsTrigger>
          <TabsTrigger value="form" disabled={!selectedTemplate}>
            Fill Details
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedDoc}>
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Template Selection */}
        <TabsContent value="template" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card
                key={template.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                  selectedTemplate?.id === template.id
                    ? 'ring-2 ring-blue-500'
                    : ''
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <Badge variant="secondary">{template.type}</Badge>
                </div>
                <h3 className="font-semibold mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {template.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Badge variant="outline">{template.category}</Badge>
                  <span>{template.requiredFields.length} fields</span>
                </div>
              </Card>
            ))}
          </div>

          {selectedTemplate && (
            <div className="flex justify-end">
              <Button onClick={() => setActiveTab('form')}>
                Continue to Form
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Form */}
        <TabsContent value="form" className="space-y-4">
          {selectedTemplate && (
            <>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedTemplate.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {selectedTemplate.description}
                </p>

                <div className="space-y-4">
                  {selectedTemplate.requiredFields.map(field => (
                    <div key={field}>
                      <Label htmlFor={field}>
                        {formatFieldName(field)}
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      {field.includes('description') ||
                      field.includes('summary') ||
                      field.includes('terms') ||
                      field.includes('analysis') ||
                      field.includes('insights') ? (
                        <Textarea
                          id={field}
                          value={formData[field] || ''}
                          onChange={(e) => handleFieldChange(field, e.target.value)}
                          placeholder={`Enter ${formatFieldName(field).toLowerCase()} or type "AI_GENERATE" for AI assistance`}
                          rows={4}
                          className="mt-1"
                        />
                      ) : (
                        <Input
                          id={field}
                          value={formData[field] || ''}
                          onChange={(e) => handleFieldChange(field, e.target.value)}
                          placeholder={`Enter ${formatFieldName(field).toLowerCase()}`}
                          className="mt-1"
                        />
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Tip: Type "AI_GENERATE" to let AI create content for this field
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('template')}
                >
                  Back
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Document
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="space-y-4">
          {generatedDoc && (
            <>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {generatedDoc.templateName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generated on {generatedDoc.metadata.generatedAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {generatedDoc.metadata.wordCount} words
                    </Badge>
                    <Badge variant="secondary">
                      Confidence: {(generatedDoc.metadata.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {generatedDoc.content}
                  </pre>
                </div>
              </Card>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedDoc(null);
                    setActiveTab('form');
                  }}
                >
                  Generate Another
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button onClick={() => toast.success('Copy to clipboard feature coming soon')}>
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
