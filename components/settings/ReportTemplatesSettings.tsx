'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ReportTemplate, SystemSettings } from '@/types/settings';
import { SettingsService } from '@/services/database/settings';
import { Save, RotateCcw, Plus, Trash2, Edit, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';

interface ReportTemplatesSettingsProps {
  settings: ReportTemplate[];
  onUpdate: (settings: SystemSettings) => void;
  userId: string;
}

const defaultTemplates: Record<string, string> = {
  invoice: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { text-align: center; margin-bottom: 30px; }
    .company-info { margin-bottom: 20px; }
    .invoice-details { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .total { font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    {{#if companyLogo}}<img src="{{companyLogo}}" alt="Logo" style="max-height: 80px;">{{/if}}
    <h1>INVOICE</h1>
  </div>
  <div class="company-info">
    <strong>{{companyName}}</strong><br>
    {{companyAddress}}<br>
    {{companyPhone}} | {{companyEmail}}
  </div>
  <div class="invoice-details">
    <p><strong>Invoice #:</strong> {{invoiceNumber}}</p>
    <p><strong>Date:</strong> {{invoiceDate}}</p>
    <p><strong>Due Date:</strong> {{dueDate}}</p>
    <p><strong>Customer:</strong> {{customerName}}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{name}}</td>
        <td>{{quantity}}</td>
        <td>{{unitPrice}}</td>
        <td>{{total}}</td>
      </tr>
      {{/each}}
    </tbody>
    <tfoot>
      <tr class="total">
        <td colspan="3">Total</td>
        <td>{{totalAmount}}</td>
      </tr>
    </tfoot>
  </table>
  {{#if footerText}}<div style="margin-top: 30px; text-align: center; font-size: 12px;">{{footerText}}</div>{{/if}}
</body>
</html>`,
  purchase_order: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { text-align: center; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <div class="header">
    {{#if companyLogo}}<img src="{{companyLogo}}" alt="Logo" style="max-height: 80px;">{{/if}}
    <h1>PURCHASE ORDER</h1>
  </div>
  <p><strong>PO #:</strong> {{poNumber}}</p>
  <p><strong>Date:</strong> {{poDate}}</p>
  <p><strong>Supplier:</strong> {{supplierName}}</p>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{name}}</td>
        <td>{{quantity}}</td>
        <td>{{unitPrice}}</td>
        <td>{{total}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</body>
</html>`,
  delivery_note: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { text-align: center; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <div class="header">
    <h1>DELIVERY NOTE</h1>
  </div>
  <p><strong>Delivery #:</strong> {{deliveryNumber}}</p>
  <p><strong>Date:</strong> {{deliveryDate}}</p>
  <p><strong>Customer:</strong> {{customerName}}</p>
  <p><strong>Delivery Address:</strong> {{deliveryAddress}}</p>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Quantity</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{name}}</td>
        <td>{{quantity}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  <div style="margin-top: 40px;">
    <p>Received by: ___________________ Date: ___________</p>
  </div>
</body>
</html>`,
  medical_report: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { text-align: center; margin-bottom: 30px; }
    .section { margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>MEDICAL REPORT</h1>
  </div>
  <div class="section">
    <h3>Patient Information</h3>
    <p><strong>Name:</strong> {{patientName}}</p>
    <p><strong>ID:</strong> {{patientId}}</p>
    <p><strong>Date of Birth:</strong> {{dateOfBirth}}</p>
  </div>
  <div class="section">
    <h3>Visit Details</h3>
    <p><strong>Date:</strong> {{visitDate}}</p>
    <p><strong>Doctor:</strong> {{doctorName}}</p>
    <p><strong>Hospital:</strong> {{hospitalName}}</p>
  </div>
  <div class="section">
    <h3>Diagnosis</h3>
    <p>{{diagnosis}}</p>
  </div>
  <div class="section">
    <h3>Medications</h3>
    {{#each medications}}
    <p>{{name}} - {{dosage}} - {{frequency}}</p>
    {{/each}}
  </div>
</body>
</html>`,
  quotation: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { text-align: center; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <div class="header">
    {{#if companyLogo}}<img src="{{companyLogo}}" alt="Logo" style="max-height: 80px;">{{/if}}
    <h1>QUOTATION</h1>
  </div>
  <p><strong>Quotation #:</strong> {{quotationNumber}}</p>
  <p><strong>Date:</strong> {{quotationDate}}</p>
  <p><strong>Valid Until:</strong> {{validUntil}}</p>
  <p><strong>Customer:</strong> {{customerName}}</p>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{name}}</td>
        <td>{{quantity}}</td>
        <td>{{unitPrice}}</td>
        <td>{{total}}</td>
      </tr>
      {{/each}}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3"><strong>Total</strong></td>
        <td><strong>{{totalAmount}}</strong></td>
      </tr>
    </tfoot>
  </table>
  <div style="margin-top: 20px;">
    <p><strong>Terms & Conditions:</strong></p>
    <p>{{termsAndConditions}}</p>
  </div>
</body>
</html>`,
};

export default function ReportTemplatesSettings({ settings, onUpdate, userId }: ReportTemplatesSettingsProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>(settings);
  const [saving, setSaving] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await SettingsService.updateReportTemplates(templates, userId);
      onUpdate(updated);
      toast.success('Report templates saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTemplates(settings);
    toast.success('Settings reset to last saved values');
  };

  const handleAddTemplate = () => {
    setEditingTemplate({
      id: Date.now().toString(),
      name: '',
      type: 'invoice',
      template: defaultTemplates.invoice,
      includeCompanyLogo: true,
    });
    setShowTemplateDialog(true);
  };

  const handleEditTemplate = (template: ReportTemplate) => {
    setEditingTemplate(template);
    setShowTemplateDialog(true);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;

    const exists = templates.find((t) => t.id === editingTemplate.id);
    if (exists) {
      setTemplates(
        templates.map((t) =>
          t.id === editingTemplate.id ? editingTemplate : t
        )
      );
    } else {
      setTemplates([...templates, editingTemplate]);
    }

    setShowTemplateDialog(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
    toast.success('Template deleted');
  };

  const handleLoadDefault = () => {
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        template: defaultTemplates[editingTemplate.type] || '',
      });
      toast.success('Default template loaded');
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          Report templates use Handlebars syntax for placeholders. Use {`{{variableName}}`} for simple values
          and {`{{#each items}}...{{/each}}`} for loops. Available variables depend on the report type.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>
                Customize templates for invoices, purchase orders, and other documents
              </CardDescription>
            </div>
            <Button onClick={handleAddTemplate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No custom templates configured. Using default templates.
            </p>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{template.name}</p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded capitalize">
                        {template.type.replace('_', ' ')}
                      </span>
                    </div>
                    {template.includeCompanyLogo && (
                      <p className="text-sm text-gray-500">Includes company logo</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowPreview(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={saving}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Template Editor Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate?.name ? 'Edit' : 'Add'} Report Template
            </DialogTitle>
            <DialogDescription>
              Customize the HTML template for your reports
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={editingTemplate.name}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        name: e.target.value,
                      })
                    }
                    placeholder="My Custom Invoice"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateType">Template Type</Label>
                  <Select
                    value={editingTemplate.type}
                    onValueChange={(value: ReportTemplate['type']) =>
                      setEditingTemplate({ ...editingTemplate, type: value })
                    }
                  >
                    <SelectTrigger id="templateType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="purchase_order">Purchase Order</SelectItem>
                      <SelectItem value="delivery_note">Delivery Note</SelectItem>
                      <SelectItem value="medical_report">Medical Report</SelectItem>
                      <SelectItem value="quotation">Quotation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="templateContent">HTML Template</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadDefault}
                  >
                    Load Default
                  </Button>
                </div>
                <Textarea
                  id="templateContent"
                  value={editingTemplate.template}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      template: e.target.value,
                    })
                  }
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Company Logo</Label>
                  <p className="text-sm text-gray-500">
                    Add company logo to the template header
                  </p>
                </div>
                <Switch
                  checked={editingTemplate.includeCompanyLogo}
                  onCheckedChange={(checked) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      includeCompanyLogo: checked,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Text (Optional)</Label>
                <Input
                  id="footerText"
                  value={editingTemplate.footerText || ''}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      footerText: e.target.value,
                    })
                  }
                  placeholder="Thank you for your business"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTemplateDialog(false);
                setEditingTemplate(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of {editingTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white overflow-auto max-h-[60vh]">
            <div dangerouslySetInnerHTML={{ __html: editingTemplate?.template || '' }} />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
