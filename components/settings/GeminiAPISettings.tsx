'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { GeminiAPISettings as GeminiAPISettingsType, SystemSettings, GeminiModel } from '@/types/settings';
import { SettingsService } from '@/services/database/settings';
import { Save, RotateCcw, Eye, EyeOff, Zap, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';

interface GeminiAPISettingsProps {
  settings: GeminiAPISettingsType;
  onUpdate: (settings: SystemSettings) => void;
  userId: string;
}

export default function GeminiAPISettings({ settings, onUpdate, userId }: GeminiAPISettingsProps) {
  const [formData, setFormData] = useState<GeminiAPISettingsType>(settings);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await SettingsService.updateGeminiAPISettings(formData, userId);
      onUpdate(updated);
      toast.success('Gemini API settings saved successfully');
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

  const handleTestConnection = async () => {
    if (!formData.apiKey) {
      toast.error('Please enter an API key first');
      return;
    }

    try {
      setTesting(true);
      // Test the API connection
      const response = await fetch('/api/gemini/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: formData.apiKey, model: formData.model }),
      });

      if (response.ok) {
        toast.success('API connection successful!');
      } else {
        const error = await response.json();
        toast.error(`API connection failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error testing API:', error);
      toast.error('Failed to test API connection');
    } finally {
      setTesting(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Gemini API is used for AI-powered features including demand forecasting, pricing optimization,
          document OCR, and business intelligence. Get your API key from{' '}
          <a
            href="https://makersuite.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Google AI Studio
          </a>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Configure your Gemini API credentials and model selection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  placeholder="Enter your Gemini API key"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !formData.apiKey}
              >
                <Zap className="h-4 w-4 mr-2" />
                {testing ? 'Testing...' : 'Test'}
              </Button>
            </div>
            {formData.apiKey && !showApiKey && (
              <p className="text-sm text-gray-500">
                Current key: {maskApiKey(formData.apiKey)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select
              value={formData.model}
              onValueChange={(value: GeminiModel) =>
                setFormData({ ...formData, model: value })
              }
            >
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-pro">
                  Gemini Pro (Text)
                </SelectItem>
                <SelectItem value="gemini-pro-vision">
                  Gemini Pro Vision (Text + Images)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              {formData.model === 'gemini-pro'
                ? 'Optimized for text-based tasks like analysis and forecasting'
                : 'Supports both text and image inputs for OCR and visual analysis'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
          <CardDescription>
            Control API usage to stay within quota limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rateLimit">Requests per Minute</Label>
            <Input
              id="rateLimit"
              type="number"
              min="1"
              max="120"
              value={formData.rateLimit}
              onChange={(e) =>
                setFormData({ ...formData, rateLimit: parseInt(e.target.value) || 60 })
              }
            />
            <p className="text-sm text-gray-500">
              Maximum number of API requests allowed per minute (default: 60)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Caching</CardTitle>
          <CardDescription>
            Reduce API costs by caching responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Response Caching</Label>
              <p className="text-sm text-gray-500">
                Cache AI responses to reduce redundant API calls
              </p>
            </div>
            <Switch
              checked={formData.enableCaching}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enableCaching: checked })
              }
            />
          </div>

          {formData.enableCaching && (
            <div className="space-y-2">
              <Label htmlFor="cacheExpiration">Cache Expiration (minutes)</Label>
              <Input
                id="cacheExpiration"
                type="number"
                min="1"
                max="60"
                value={formData.cacheExpiration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cacheExpiration: parseInt(e.target.value) || 5,
                  })
                }
              />
              <p className="text-sm text-gray-500">
                How long to keep cached responses before refreshing (default: 5 minutes)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Usage Statistics</CardTitle>
          <CardDescription>
            Monitor your current API usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-2xl font-bold text-blue-600">0</p>
              <p className="text-xs text-gray-500">API calls</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-xs text-gray-500">API calls</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Estimated Cost</p>
              <p className="text-2xl font-bold text-purple-600">$0.00</p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Note: Usage statistics are tracked in the Admin Dashboard
          </p>
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
    </div>
  );
}
