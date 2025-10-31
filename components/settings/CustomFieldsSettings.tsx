'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomFieldsConfig, CustomField, SystemSettings, FieldType } from '@/types/settings';
import { SettingsService } from '@/services/database/settings';
import { Save, RotateCcw, Plus, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

interface CustomFieldsSettingsProps {
  settings: CustomFieldsConfig;
  onUpdate: (settings: SystemSettings) => void;
  userId: string;
}

export default function CustomFieldsSettings({ settings, onUpdate, userId }: CustomFieldsSettingsProps) {
  const [formData, setFormData] = useState<CustomFieldsConfig>(settings);
  const [saving, setSaving] = useState(false);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [currentEntity, setCurrentEntity] = useState<keyof CustomFieldsConfig>('products');

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await SettingsService.updateCustomFields(formData, userId);
      onUpdate(updated);
      toast.success('Custom fields saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings);
    toast.success('Settings reset to last saved values');
  };

  const handleAddField = (entity: keyof CustomFieldsConfig) => {
    setCurrentEntity(entity);
    setEditingField({
      id: Date.now().toString(),
      name: '',
      label: '',
      type: 'text',
      required: false,
    });
    setShowFieldDialog(true);
  };

  const handleEditField = (entity: keyof CustomFieldsConfig, field: CustomField) => {
    setCurrentEntity(entity);
    setEditingField(field);
    setShowFieldDialog(true);
  };

  const handleSaveField = () => {
    if (!editingField) return;

    const exists = formData[currentEntity].find((f) => f.id === editingField.id);
    if (exists) {
      setFormData({
        ...formData,
        [currentEntity]: formData[currentEntity].map((f) =>
          f.id === editingField.id ? editingField : f
        ),
      });
    } else {
      setFormData({
        ...formData,
        [currentEntity]: [...formData[currentEntity], editingField],
      });
    }

    setShowFieldDialog(false);
    setEditingField(null);
  };

  const handleDeleteField = (entity: keyof CustomFieldsConfig, id: string) => {
    setFormData({
      ...formData,
      [entity]: formData[entity].filter((f) => f.id !== id),
    });
    toast.success('Custom field deleted');
  };

  const renderFieldsList = (entity: keyof CustomFieldsConfig) => {
    const fields = formData[entity];

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="capitalize">{entity} Custom Fields</CardTitle>
              <CardDescription>
                Add custom fields to {entity} forms
              </CardDescription>
            </div>
            <Button onClick={() => handleAddField(entity)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No custom fields configured for {entity}
            </p>
          ) : (
            <div className="space-y-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{field.label}</p>
                      {field.required && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {field.name} • {field.type}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditField(entity, field)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteField(entity, field.id)}
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
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="medicalRecords">Medical Records</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          {renderFieldsList('products')}
        </TabsContent>

        <TabsContent value="customers">
          {renderFieldsList('customers')}
        </TabsContent>

        <TabsContent value="orders">
          {renderFieldsList('orders')}
        </TabsContent>

        <TabsContent value="medicalRecords">
          {renderFieldsList('medicalRecords')}
        </TabsContent>
      </Tabs>

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

      {/* Field Editor Dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingField?.label ? 'Edit' : 'Add'} Custom Field
            </DialogTitle>
            <DialogDescription>
              Configure custom field properties
            </DialogDescription>
          </DialogHeader>
          {editingField && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fieldName">Field Name</Label>
                  <Input
                    id="fieldName"
                    value={editingField.name}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        name: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                      })
                    }
                    placeholder="field_name"
                  />
                  <p className="text-xs text-gray-500">
                    Internal name (lowercase, underscores only)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fieldLabel">Field Label</Label>
                  <Input
                    id="fieldLabel"
                    value={editingField.label}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        label: e.target.value,
                      })
                    }
                    placeholder="Field Label"
                  />
                  <p className="text-xs text-gray-500">
                    Display label shown to users
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fieldType">Field Type</Label>
                <Select
                  value={editingField.type}
                  onValueChange={(value: FieldType) =>
                    setEditingField({ ...editingField, type: value })
                  }
                >
                  <SelectTrigger id="fieldType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="dropdown">Dropdown</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingField.type === 'dropdown' && (
                <div className="space-y-2">
                  <Label htmlFor="fieldOptions">Dropdown Options</Label>
                  <Textarea
                    id="fieldOptions"
                    value={editingField.options?.join('\n') || ''}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        options: e.target.value.split('\n').filter((o) => o.trim()),
                      })
                    }
                    placeholder="Enter one option per line"
                    rows={4}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Required Field</Label>
                  <p className="text-sm text-gray-500">
                    Make this field mandatory
                  </p>
                </div>
                <Switch
                  checked={editingField.required}
                  onCheckedChange={(checked) =>
                    setEditingField({ ...editingField, required: checked })
                  }
                />
              </div>

              {(editingField.type === 'text' || editingField.type === 'number') && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Validation Rules (Optional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {editingField.type === 'number' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="minValue">Minimum Value</Label>
                          <Input
                            id="minValue"
                            type="number"
                            value={editingField.validation?.min || ''}
                            onChange={(e) =>
                              setEditingField({
                                ...editingField,
                                validation: {
                                  ...editingField.validation,
                                  min: parseFloat(e.target.value) || undefined,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxValue">Maximum Value</Label>
                          <Input
                            id="maxValue"
                            type="number"
                            value={editingField.validation?.max || ''}
                            onChange={(e) =>
                              setEditingField({
                                ...editingField,
                                validation: {
                                  ...editingField.validation,
                                  max: parseFloat(e.target.value) || undefined,
                                },
                              })
                            }
                          />
                        </div>
                      </>
                    )}
                    {editingField.type === 'text' && (
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="pattern">Pattern (Regex)</Label>
                        <Input
                          id="pattern"
                          value={editingField.validation?.pattern || ''}
                          onChange={(e) =>
                            setEditingField({
                              ...editingField,
                              validation: {
                                ...editingField.validation,
                                pattern: e.target.value || undefined,
                              },
                            })
                          }
                          placeholder="^[A-Z]{3}-\d{4}$"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFieldDialog(false);
                setEditingField(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveField}>
              Save Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
