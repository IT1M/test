'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, X, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface ReportField {
  id: string;
  entity: string;
  field: string;
  label: string;
}

interface ReportFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

const AVAILABLE_ENTITIES = [
  { value: 'products', label: 'Products' },
  { value: 'customers', label: 'Customers' },
  { value: 'orders', label: 'Orders' },
  { value: 'sales', label: 'Sales' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'patients', label: 'Patients' },
  { value: 'medicalRecords', label: 'Medical Records' },
];

const ENTITY_FIELDS: Record<string, Array<{ value: string; label: string; type: string }>> = {
  products: [
    { value: 'sku', label: 'SKU', type: 'string' },
    { value: 'name', label: 'Product Name', type: 'string' },
    { value: 'category', label: 'Category', type: 'string' },
    { value: 'manufacturer', label: 'Manufacturer', type: 'string' },
    { value: 'unitPrice', label: 'Unit Price', type: 'number' },
    { value: 'costPrice', label: 'Cost Price', type: 'number' },
    { value: 'stockQuantity', label: 'Stock Quantity', type: 'number' },
    { value: 'reorderLevel', label: 'Reorder Level', type: 'number' },
  ],
  customers: [
    { value: 'customerId', label: 'Customer ID', type: 'string' },
    { value: 'name', label: 'Customer Name', type: 'string' },
    { value: 'type', label: 'Type', type: 'string' },
    { value: 'email', label: 'Email', type: 'string' },
    { value: 'phone', label: 'Phone', type: 'string' },
    { value: 'segment', label: 'Segment', type: 'string' },
    { value: 'creditLimit', label: 'Credit Limit', type: 'number' },
  ],
  orders: [
    { value: 'orderId', label: 'Order ID', type: 'string' },
    { value: 'orderDate', label: 'Order Date', type: 'date' },
    { value: 'status', label: 'Status', type: 'string' },
    { value: 'totalAmount', label: 'Total Amount', type: 'number' },
    { value: 'paymentStatus', label: 'Payment Status', type: 'string' },
    { value: 'salesPerson', label: 'Sales Person', type: 'string' },
  ],
  sales: [
    { value: 'saleId', label: 'Sale ID', type: 'string' },
    { value: 'saleDate', label: 'Sale Date', type: 'date' },
    { value: 'totalAmount', label: 'Total Amount', type: 'number' },
    { value: 'profit', label: 'Profit', type: 'number' },
    { value: 'profitMargin', label: 'Profit Margin', type: 'number' },
    { value: 'salesPerson', label: 'Sales Person', type: 'string' },
  ],
  inventory: [
    { value: 'warehouseLocation', label: 'Warehouse Location', type: 'string' },
    { value: 'quantity', label: 'Quantity', type: 'number' },
    { value: 'reservedQuantity', label: 'Reserved Quantity', type: 'number' },
    { value: 'availableQuantity', label: 'Available Quantity', type: 'number' },
  ],
  patients: [
    { value: 'patientId', label: 'Patient ID', type: 'string' },
    { value: 'firstName', label: 'First Name', type: 'string' },
    { value: 'lastName', label: 'Last Name', type: 'string' },
    { value: 'gender', label: 'Gender', type: 'string' },
    { value: 'age', label: 'Age', type: 'number' },
    { value: 'bloodType', label: 'Blood Type', type: 'string' },
  ],
  medicalRecords: [
    { value: 'recordId', label: 'Record ID', type: 'string' },
    { value: 'recordType', label: 'Record Type', type: 'string' },
    { value: 'visitDate', label: 'Visit Date', type: 'date' },
    { value: 'diagnosis', label: 'Diagnosis', type: 'string' },
    { value: 'doctorName', label: 'Doctor Name', type: 'string' },
    { value: 'hospitalName', label: 'Hospital Name', type: 'string' },
  ],
};

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'between', label: 'Between' },
];

export default function ReportBuilderPage() {
  const [reportName, setReportName] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('products');
  const [selectedFields, setSelectedFields] = useState<ReportField[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [groupBy, setGroupBy] = useState('');
  const [sortBy, setSortBy] = useState<ReportSort>({ field: '', direction: 'asc' });
  const [showPreview, setShowPreview] = useState(false);

  const addField = (field: { value: string; label: string }) => {
    const newField: ReportField = {
      id: `${selectedEntity}-${field.value}-${Date.now()}`,
      entity: selectedEntity,
      field: field.value,
      label: field.label,
    };
    setSelectedFields([...selectedFields, newField]);
  };

  const removeField = (id: string) => {
    setSelectedFields(selectedFields.filter(f => f.id !== id));
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter-${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<ReportFilter>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const handleGenerateReport = () => {
    // In a real implementation, this would generate the report
    alert('Report generation functionality would be implemented here');
  };

  const handleSaveTemplate = () => {
    // In a real implementation, this would save the report template
    alert('Save template functionality would be implemented here');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/reports">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Reports
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Custom Report Builder</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              <Button variant="outline" onClick={handleSaveTemplate}>
                Save Template
              </Button>
              <Button onClick={handleGenerateReport}>
                Generate Report
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Name */}
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reportName">Report Name</Label>
                  <Input
                    id="reportName"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter report name"
                  />
                </div>

                <div>
                  <Label htmlFor="entity">Data Source</Label>
                  <select
                    id="entity"
                    value={selectedEntity}
                    onChange={(e) => setSelectedEntity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {AVAILABLE_ENTITIES.map((entity) => (
                      <option key={entity.value} value={entity.value}>
                        {entity.label}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Field Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {ENTITY_FIELDS[selectedEntity]?.map((field) => (
                      <Button
                        key={field.value}
                        variant="outline"
                        size="sm"
                        onClick={() => addField(field)}
                        disabled={selectedFields.some(f => f.field === field.value && f.entity === selectedEntity)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {field.label}
                      </Button>
                    ))}
                  </div>

                  {selectedFields.length > 0 && (
                    <div className="mt-4">
                      <Label>Selected Fields</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedFields.map((field) => (
                          <Badge key={field.id} variant="secondary" className="flex items-center gap-1">
                            {field.label}
                            <button
                              onClick={() => removeField(field.id)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Filters</CardTitle>
                  <Button variant="outline" size="sm" onClick={addFilter}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filters.length === 0 ? (
                  <p className="text-sm text-gray-500">No filters added</p>
                ) : (
                  <div className="space-y-3">
                    {filters.map((filter) => (
                      <div key={filter.id} className="flex gap-2 items-start">
                        <select
                          value={filter.field}
                          onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="">Select field</option>
                          {ENTITY_FIELDS[selectedEntity]?.map((field) => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={filter.operator}
                          onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded-md text-sm"
                        >
                          {OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                        <Input
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          placeholder="Value"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(filter.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Grouping and Sorting */}
            <Card>
              <CardHeader>
                <CardTitle>Grouping & Sorting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="groupBy">Group By</Label>
                  <select
                    id="groupBy"
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">No grouping</option>
                    {selectedFields.map((field) => (
                      <option key={field.id} value={field.field}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="sortBy">Sort By</Label>
                  <div className="flex gap-2">
                    <select
                      id="sortBy"
                      value={sortBy.field}
                      onChange={(e) => setSortBy({ ...sortBy, field: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-md"
                    >
                      <option value="">No sorting</option>
                      {selectedFields.map((field) => (
                        <option key={field.id} value={field.field}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={sortBy.direction}
                      onChange={(e) => setSortBy({ ...sortBy, direction: e.target.value as 'asc' | 'desc' })}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {showPreview ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Report Name</p>
                      <p className="text-sm">{reportName || 'Untitled Report'}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600">Data Source</p>
                      <p className="text-sm capitalize">{selectedEntity}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600">Fields ({selectedFields.length})</p>
                      <ul className="text-sm space-y-1 mt-1">
                        {selectedFields.map((field) => (
                          <li key={field.id} className="text-gray-700">• {field.label}</li>
                        ))}
                      </ul>
                    </div>

                    {filters.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Filters ({filters.length})</p>
                        <ul className="text-sm space-y-1 mt-1">
                          {filters.map((filter) => (
                            <li key={filter.id} className="text-gray-700">
                              • {filter.field} {filter.operator} {filter.value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {groupBy && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Grouped By</p>
                        <p className="text-sm">{groupBy}</p>
                      </div>
                    )}

                    {sortBy.field && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Sorted By</p>
                        <p className="text-sm">{sortBy.field} ({sortBy.direction})</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Click "Show Preview" to see report configuration
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
