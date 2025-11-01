'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Permission, hasPermission } from '@/lib/auth/rbac';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  Shield, 
  Zap, 
  Database,
  Clock,
  DollarSign,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

interface ModelConfig {
  enabled: boolean;
  version: string;
  endpoint: string;
  timeout_ms: number;
  max_retries: number;
  rate_limit: {
    requests_per_minute: number;
    requests_per_hour: number;
    daily_quota: number;
  };
  confidence_threshold: {
    auto_approve: number;
    require_review: number;
    auto_reject: number;
  };
  cost_limits: {
    daily_budget: number;
    alert_threshold: number;
  };
}

interface SecurityConfig {
  phi_sanitization_enabled: boolean;
  encryption_in_transit: boolean;
  data_retention_days: number;
  require_mfa_for_critical: boolean;
}

interface PerformanceConfig {
  cache_enabled: boolean;
  cache_duration_seconds: number;
  batch_processing_enabled: boolean;
}

interface AISettings {
  models: Record<string, ModelConfig>;
  security: SecurityConfig;
  performance: PerformanceConfig;
}

interface ConfirmationDialog {
  isOpen: boolean;
  title: string;
  description: string;
  impact: string;
  onConfirm: () => void;
}

export default function AISettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<AISettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('models');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    title: '',
    description: '',
    impact: '',
    onConfirm: () => {}
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Check permissions
  useEffect(() => {
    if (!user || !hasPermission(user, Permission.MANAGE_AI_SETTINGS)) {
      router.push('/unauthorized');
    }
  }, [user, router]);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/ai-control/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
          setOriginalSettings(JSON.parse(JSON.stringify(data)));
        } else {
          toast.error('Failed to load settings');
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Check for changes
  useEffect(() => {
    if (settings && originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  // Validate settings
  const validateSettings = (): boolean => {
    const errors: Record<string, string> = {};

    if (settings) {
      // Validate model configurations
      Object.entries(settings.models).forEach(([modelName, config]) => {
        if (config.timeout_ms < 1000 || config.timeout_ms > 120000) {
          errors[`${modelName}.timeout`] = 'Timeout must be between 1 and 120 seconds';
        }
        if (config.max_retries < 0 || config.max_retries > 10) {
          errors[`${modelName}.retries`] = 'Max retries must be between 0 and 10';
        }
        if (config.rate_limit.requests_per_minute < 1 || config.rate_limit.requests_per_minute > 1000) {
          errors[`${modelName}.rate_limit`] = 'Rate limit must be between 1 and 1000 requests/minute';
        }
        if (config.confidence_threshold.auto_approve < 0.5 || config.confidence_threshold.auto_approve > 1) {
          errors[`${modelName}.confidence`] = 'Auto-approve threshold must be between 0.5 and 1.0';
        }
        if (config.cost_limits.daily_budget < 0) {
          errors[`${modelName}.budget`] = 'Daily budget must be positive';
        }
      });

      // Validate security settings
      if (settings.security.data_retention_days < 30 || settings.security.data_retention_days > 3650) {
        errors['security.retention'] = 'Data retention must be between 30 and 3650 days';
      }

      // Validate performance settings
      if (settings.performance.cache_duration_seconds < 60 || settings.performance.cache_duration_seconds > 86400) {
        errors['performance.cache'] = 'Cache duration must be between 60 and 86400 seconds';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save settings
  const handleSave = async () => {
    if (!validateSettings()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/ai-control/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          reason: 'Manual configuration update',
          userId: user?.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        setOriginalSettings(JSON.parse(JSON.stringify(settings)));
        setHasChanges(false);
        toast.success('Settings saved successfully');
        
        // Log configuration change
        await logConfigurationChange('settings_updated', 'All settings updated');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset settings
  const handleReset = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Settings',
      description: 'Are you sure you want to discard all changes?',
      impact: 'All unsaved changes will be lost.',
      onConfirm: () => {
        setSettings(JSON.parse(JSON.stringify(originalSettings)));
        setHasChanges(false);
        setValidationErrors({});
        toast.success('Settings reset');
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  // Log configuration change
  const logConfigurationChange = async (settingName: string, description: string) => {
    try {
      const { db } = await import('@/lib/db/schema');
      await db.aiConfigurationHistory.add({
        id: `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId: user?.id || 'unknown',
        settingName,
        settingCategory: 'other',
        oldValue: JSON.stringify(originalSettings),
        newValue: JSON.stringify(settings),
        reason: description,
        impactLevel: 'medium',
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Failed to log configuration change:', error);
    }
  };

  // Update model setting
  const updateModelSetting = (modelName: string, path: string, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings };
    const keys = path.split('.');
    let current: any = newSettings.models[modelName];
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    setSettings(newSettings);
  };

  // Update security setting
  const updateSecuritySetting = (key: keyof SecurityConfig, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      security: {
        ...settings.security,
        [key]: value
      }
    });
  };

  // Update performance setting
  const updatePerformanceSetting = (key: keyof PerformanceConfig, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      performance: {
        ...settings.performance,
        [key]: value
      }
    });
  };

  // Toggle model enabled with confirmation
  const toggleModelEnabled = (modelName: string, enabled: boolean) => {
    const action = enabled ? 'enable' : 'disable';
    setConfirmDialog({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Model`,
      description: `Are you sure you want to ${action} ${modelName}?`,
      impact: enabled 
        ? 'This model will start processing requests immediately.'
        : 'All features using this model will be temporarily unavailable.',
      onConfirm: () => {
        updateModelSetting(modelName, 'enabled', enabled);
        toast.success(`Model ${action}d successfully`);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  if (!user || !hasPermission(user, Permission.MANAGE_AI_SETTINGS)) {
    return null;
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/ai-control-center')}
              >
                ← Back
              </Button>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI Settings
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure AI models, security, and performance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Unsaved Changes
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges || isSaving}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Validation Errors */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>Validation Errors:</strong>
              <ul className="mt-2 list-disc list-inside">
                {Object.entries(validationErrors).map(([key, error]) => (
                  <li key={key}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Models</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Automation</span>
            </TabsTrigger>
          </TabsList>

          {/* Model Configuration Tab */}
          <TabsContent value="models" className="space-y-6">
            {Object.entries(settings.models).map(([modelName, config]) => (
              <Card key={modelName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {modelName}
                        <Badge variant={config.enabled ? 'default' : 'secondary'}>
                          {config.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>Version {config.version}</CardDescription>
                    </div>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(checked) => toggleModelEnabled(modelName, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${modelName}-version`}>Version</Label>
                      <Input
                        id={`${modelName}-version`}
                        value={config.version}
                        onChange={(e) => updateModelSetting(modelName, 'version', e.target.value)}
                        disabled={!config.enabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${modelName}-endpoint`}>Endpoint</Label>
                      <Input
                        id={`${modelName}-endpoint`}
                        value={config.endpoint}
                        onChange={(e) => updateModelSetting(modelName, 'endpoint', e.target.value)}
                        disabled={!config.enabled}
                      />
                    </div>
                  </div>

                  {/* Performance Settings */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Performance Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${modelName}-timeout`}>
                          Timeout (ms)
                          <span className="text-xs text-gray-500 ml-1">(1000-120000)</span>
                        </Label>
                        <Input
                          id={`${modelName}-timeout`}
                          type="number"
                          value={config.timeout_ms}
                          onChange={(e) => updateModelSetting(modelName, 'timeout_ms', parseInt(e.target.value))}
                          disabled={!config.enabled}
                          min={1000}
                          max={120000}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${modelName}-retries`}>
                          Max Retries
                          <span className="text-xs text-gray-500 ml-1">(0-10)</span>
                        </Label>
                        <Input
                          id={`${modelName}-retries`}
                          type="number"
                          value={config.max_retries}
                          onChange={(e) => updateModelSetting(modelName, 'max_retries', parseInt(e.target.value))}
                          disabled={!config.enabled}
                          min={0}
                          max={10}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${modelName}-rpm`}>
                          Requests/Minute
                          <span className="text-xs text-gray-500 ml-1">(1-1000)</span>
                        </Label>
                        <Input
                          id={`${modelName}-rpm`}
                          type="number"
                          value={config.rate_limit.requests_per_minute}
                          onChange={(e) => updateModelSetting(modelName, 'rate_limit.requests_per_minute', parseInt(e.target.value))}
                          disabled={!config.enabled}
                          min={1}
                          max={1000}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Confidence Thresholds */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Confidence Thresholds</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${modelName}-auto-approve`}>
                          Auto Approve
                          <span className="text-xs text-gray-500 ml-1">(0.5-1.0)</span>
                        </Label>
                        <Input
                          id={`${modelName}-auto-approve`}
                          type="number"
                          step="0.01"
                          value={config.confidence_threshold.auto_approve}
                          onChange={(e) => updateModelSetting(modelName, 'confidence_threshold.auto_approve', parseFloat(e.target.value))}
                          disabled={!config.enabled}
                          min={0.5}
                          max={1.0}
                        />
                        <p className="text-xs text-gray-500">Results above this threshold are automatically approved</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${modelName}-require-review`}>
                          Require Review
                          <span className="text-xs text-gray-500 ml-1">(0.3-0.9)</span>
                        </Label>
                        <Input
                          id={`${modelName}-require-review`}
                          type="number"
                          step="0.01"
                          value={config.confidence_threshold.require_review}
                          onChange={(e) => updateModelSetting(modelName, 'confidence_threshold.require_review', parseFloat(e.target.value))}
                          disabled={!config.enabled}
                          min={0.3}
                          max={0.9}
                        />
                        <p className="text-xs text-gray-500">Results in this range require manual review</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${modelName}-auto-reject`}>
                          Auto Reject
                          <span className="text-xs text-gray-500 ml-1">(0.0-0.5)</span>
                        </Label>
                        <Input
                          id={`${modelName}-auto-reject`}
                          type="number"
                          step="0.01"
                          value={config.confidence_threshold.auto_reject}
                          onChange={(e) => updateModelSetting(modelName, 'confidence_threshold.auto_reject', parseFloat(e.target.value))}
                          disabled={!config.enabled}
                          min={0.0}
                          max={0.5}
                        />
                        <p className="text-xs text-gray-500">Results below this threshold are automatically rejected</p>
                      </div>
                    </div>
                  </div>

                  {/* Cost Limits */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Cost Limits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${modelName}-daily-budget`}>
                          <DollarSign className="w-4 h-4 inline mr-1" />
                          Daily Budget
                        </Label>
                        <Input
                          id={`${modelName}-daily-budget`}
                          type="number"
                          step="0.01"
                          value={config.cost_limits.daily_budget}
                          onChange={(e) => updateModelSetting(modelName, 'cost_limits.daily_budget', parseFloat(e.target.value))}
                          disabled={!config.enabled}
                          min={0}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${modelName}-alert-threshold`}>
                          <AlertTriangle className="w-4 h-4 inline mr-1" />
                          Alert Threshold
                        </Label>
                        <Input
                          id={`${modelName}-alert-threshold`}
                          type="number"
                          step="0.01"
                          value={config.cost_limits.alert_threshold}
                          onChange={(e) => updateModelSetting(modelName, 'cost_limits.alert_threshold', parseFloat(e.target.value))}
                          disabled={!config.enabled}
                          min={0}
                        />
                        <p className="text-xs text-gray-500">Alert when cost reaches this amount</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Performance Tuning Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Configuration</CardTitle>
                <CardDescription>
                  Optimize AI performance with caching and batch processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cache Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="cache-enabled" className="text-base font-semibold">
                        Enable Response Caching
                      </Label>
                      <p className="text-sm text-gray-500">
                        Cache AI responses to reduce API calls and improve response time
                      </p>
                    </div>
                    <Switch
                      id="cache-enabled"
                      checked={settings.performance.cache_enabled}
                      onCheckedChange={(checked) => updatePerformanceSetting('cache_enabled', checked)}
                    />
                  </div>

                  {settings.performance.cache_enabled && (
                    <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                      <Label htmlFor="cache-duration">
                        Cache Duration (seconds)
                        <span className="text-xs text-gray-500 ml-1">(60-86400)</span>
                      </Label>
                      <Input
                        id="cache-duration"
                        type="number"
                        value={settings.performance.cache_duration_seconds}
                        onChange={(e) => updatePerformanceSetting('cache_duration_seconds', parseInt(e.target.value))}
                        min={60}
                        max={86400}
                      />
                      <p className="text-xs text-gray-500">
                        How long to cache responses (1 minute to 24 hours)
                      </p>
                    </div>
                  )}
                </div>

                {/* Batch Processing */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="batch-enabled" className="text-base font-semibold">
                        Enable Batch Processing
                      </Label>
                      <p className="text-sm text-gray-500">
                        Process multiple requests together for better efficiency
                      </p>
                    </div>
                    <Switch
                      id="batch-enabled"
                      checked={settings.performance.batch_processing_enabled}
                      onCheckedChange={(checked) => updatePerformanceSetting('batch_processing_enabled', checked)}
                    />
                  </div>
                </div>

                {/* Rate Limiting Info */}
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Rate Limiting:</strong> Configure per-model rate limits in the Models tab.
                    Global rate limits are managed automatically based on API quotas.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security & Privacy Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security & Privacy Configuration
                </CardTitle>
                <CardDescription>
                  Configure data protection, encryption, and compliance settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PHI Sanitization */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="phi-sanitization" className="text-base font-semibold text-blue-900 dark:text-blue-100">
                        <Lock className="w-4 h-4 inline mr-2" />
                        PHI Sanitization
                      </Label>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Automatically remove Protected Health Information (PHI) before sending to AI models
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                        Removes: Names, IDs, Dates of Birth, Addresses, Phone Numbers, Medical Record Numbers
                      </p>
                    </div>
                    <Switch
                      id="phi-sanitization"
                      checked={settings.security.phi_sanitization_enabled}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Disable PHI Sanitization',
                            description: 'Disabling PHI sanitization will send unredacted medical data to external AI services.',
                            impact: '⚠️ CRITICAL: This may violate HIPAA compliance and expose sensitive patient information. Only disable for testing in non-production environments.',
                            onConfirm: () => {
                              updateSecuritySetting('phi_sanitization_enabled', false);
                              toast.error('PHI Sanitization disabled - Use with extreme caution!');
                              setConfirmDialog({ ...confirmDialog, isOpen: false });
                            }
                          });
                        } else {
                          updateSecuritySetting('phi_sanitization_enabled', true);
                          toast.success('PHI Sanitization enabled');
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Encryption */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="encryption-transit" className="text-base font-semibold">
                        Encryption in Transit
                      </Label>
                      <p className="text-sm text-gray-500">
                        Use TLS 1.3 for all external API communications
                      </p>
                    </div>
                    <Switch
                      id="encryption-transit"
                      checked={settings.security.encryption_in_transit}
                      onCheckedChange={(checked) => updateSecuritySetting('encryption_in_transit', checked)}
                      disabled={true}
                    />
                  </div>
                  <p className="text-xs text-gray-500 pl-4">
                    <CheckCircle className="w-3 h-3 inline text-green-500 mr-1" />
                    This setting is enforced and cannot be disabled for security compliance
                  </p>
                </div>

                {/* Data Retention */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="data-retention" className="text-base font-semibold">
                      Data Retention Period
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">
                      How long to retain AI activity logs and configuration history
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        id="data-retention"
                        type="number"
                        value={settings.security.data_retention_days}
                        onChange={(e) => updateSecuritySetting('data_retention_days', parseInt(e.target.value))}
                        min={30}
                        max={3650}
                        className="w-32"
                      />
                      <span className="text-sm text-gray-600">days</span>
                      <span className="text-xs text-gray-500">
                        ({Math.floor(settings.security.data_retention_days / 365)} years, {settings.security.data_retention_days % 365} days)
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Minimum: 30 days | Maximum: 3650 days (10 years) | Recommended: 365 days (1 year)
                    </p>
                  </div>
                </div>

                {/* MFA Requirement */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="mfa-required" className="text-base font-semibold text-yellow-900 dark:text-yellow-100">
                        <Shield className="w-4 h-4 inline mr-2" />
                        Require MFA for Critical Operations
                      </Label>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Require multi-factor authentication for sensitive configuration changes
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                        Critical operations: Disabling models, changing security settings, modifying cost limits
                      </p>
                    </div>
                    <Switch
                      id="mfa-required"
                      checked={settings.security.require_mfa_for_critical}
                      onCheckedChange={(checked) => updateSecuritySetting('require_mfa_for_critical', checked)}
                    />
                  </div>
                </div>

                {/* Security Best Practices */}
                <Alert>
                  <Shield className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Security Best Practices:</strong>
                    <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                      <li>Always keep PHI sanitization enabled in production</li>
                      <li>Enable MFA for all administrators</li>
                      <li>Review audit logs regularly for suspicious activity</li>
                      <li>Set appropriate data retention periods based on compliance requirements</li>
                      <li>Use strong API keys and rotate them periodically</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automation Rules Tab */}
          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Automation Rules
                </CardTitle>
                <CardDescription>
                  Configure automated AI-driven workflows and triggers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Automation Rule Builder
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Create automated workflows that trigger AI operations based on events, schedules, or conditions.
                  </p>
                  <Button
                    onClick={() => router.push('/ai-control-center/automation')}
                    className="gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Open Automation Builder
                  </Button>
                  
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Event-Based</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Trigger AI operations when specific events occur (e.g., document uploaded, order created)
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Schedule-Based</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Run AI operations on a schedule (e.g., daily reports, weekly forecasts)
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Condition-Based</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Execute AI operations when conditions are met (e.g., low confidence, high cost)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, isOpen: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>{confirmDialog.description}</p>
              {confirmDialog.impact && (
                <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                    <strong>Impact:</strong> {confirmDialog.impact}
                  </AlertDescription>
                </Alert>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDialog.onConfirm}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
