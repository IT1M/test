'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Permission, hasPermission } from '@/lib/auth/rbac';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Key,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Shield,
  Activity,
  Zap,
  Settings,
  Globe,
  Link as LinkIcon,
  BarChart3,
  Clock,
  TrendingUp,
  AlertCircle,
  Webhook,
  Code,
  Database
} from 'lucide-react';
import { APIKeyManager } from '@/services/ai/api-key-manager';
import { cn } from '@/lib/utils/cn';

interface APIConnection {
  id: string;
  name: string;
  service: string;
  endpoint: string;
  status: 'connected' | 'disconnected' | 'error';
  health: 'healthy' | 'degraded' | 'down';
  lastChecked: Date;
  responseTime: number;
  version: string;
  apiKeyId?: string;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  lastTriggered?: Date;
  successCount: number;
  failureCount: number;
}

interface APIUsageStats {
  endpoint: string;
  calls: number;
  avgResponseTime: number;
  errorRate: number;
  lastCalled: Date;
}

export default function IntegrationsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('connections');
  
  // API Connections
  const [connections, setConnections] = useState<APIConnection[]>([]);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  
  // API Keys
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [rotationReminders, setRotationReminders] = useState<any[]>([]);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [showRotateKeyModal, setShowRotateKeyModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<any>(null);
  const [showKeyValue, setShowKeyValue] = useState<Record<string, boolean>>({});
  
  // Webhooks
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [showAddWebhookModal, setShowAddWebhookModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  
  // API Usage
  const [usageStats, setUsageStats] = useState<APIUsageStats[]>([]);
  const [selectedVersion, setSelectedVersion] = useState('v1');
  
  // Form state
  const [keyFormData, setKeyFormData] = useState({
    name: '',
    service: 'gemini',
    apiKey: '',
    rotationIntervalDays: 90,
  });
  
  const [webhookFormData, setWebhookFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
  });

  // Check permissions
  useEffect(() => {
    if (!user || !hasPermission(user, Permission.ACCESS_AI_CONTROL_CENTER)) {
      router.push('/unauthorized');
    }
  }, [user, router]);

  // Load data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadConnections(),
      loadAPIKeys(),
      loadWebhooks(),
      loadUsageStats(),
    ]);
    setIsLoading(false);
  };

  const loadConnections = async () => {
    // Mock data - in production, fetch from API
    const mockConnections: APIConnection[] = [
      {
        id: '1',
        name: 'Google Gemini Pro',
        service: 'gemini',
        endpoint: 'https://generativelanguage.googleapis.com/v1',
        status: 'connected',
        health: 'healthy',
        lastChecked: new Date(),
        responseTime: 145,
        version: 'v1',
        apiKeyId: 'key-1',
      },
      {
        id: '2',
        name: 'Google Gemini Vision',
        service: 'gemini-vision',
        endpoint: 'https://generativelanguage.googleapis.com/v1',
        status: 'connected',
        health: 'healthy',
        lastChecked: new Date(),
        responseTime: 230,
        version: 'v1',
        apiKeyId: 'key-1',
      },
      {
        id: '3',
        name: 'Document Storage API',
        service: 'storage',
        endpoint: 'https://storage.googleapis.com/v1',
        status: 'connected',
        health: 'healthy',
        lastChecked: new Date(),
        responseTime: 89,
        version: 'v1',
      },
    ];
    setConnections(mockConnections);
  };

  const loadAPIKeys = async () => {
    const keys = await APIKeyManager.listAPIKeys();
    setApiKeys(keys);
    
    const reminders = await APIKeyManager.getRotationReminders();
    setRotationReminders(reminders);
  };

  const loadWebhooks = async () => {
    // Mock data - in production, fetch from API
    const mockWebhooks: WebhookConfig[] = [
      {
        id: '1',
        name: 'AI Operation Complete',
        url: 'https://example.com/webhooks/ai-complete',
        events: ['ai.operation.complete', 'ai.operation.error'],
        isActive: true,
        secret: 'whsec_***',
        lastTriggered: new Date(Date.now() - 3600000),
        successCount: 1247,
        failureCount: 3,
      },
      {
        id: '2',
        name: 'Low Confidence Alert',
        url: 'https://example.com/webhooks/low-confidence',
        events: ['ai.confidence.low'],
        isActive: true,
        secret: 'whsec_***',
        lastTriggered: new Date(Date.now() - 7200000),
        successCount: 45,
        failureCount: 0,
      },
    ];
    setWebhooks(mockWebhooks);
  };

  const loadUsageStats = async () => {
    // Mock data - in production, fetch from API
    const mockStats: APIUsageStats[] = [
      {
        endpoint: '/v1/models/gemini-pro:generateContent',
        calls: 1247,
        avgResponseTime: 145,
        errorRate: 0.02,
        lastCalled: new Date(),
      },
      {
        endpoint: '/v1/models/gemini-pro-vision:generateContent',
        calls: 523,
        avgResponseTime: 230,
        errorRate: 0.01,
        lastCalled: new Date(),
      },
      {
        endpoint: '/v1/models/gemini-pro:countTokens',
        calls: 89,
        avgResponseTime: 45,
        errorRate: 0.00,
        lastCalled: new Date(),
      },
    ];
    setUsageStats(mockStats);
  };

  // Test connection health
  const testConnection = async (connectionId: string) => {
    setTestingConnection(connectionId);
    
    try {
      // Simulate API health check
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update connection status
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, lastChecked: new Date(), status: 'connected', health: 'healthy' }
          : conn
      ));
    } catch (error) {
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, status: 'error', health: 'down' }
          : conn
      ));
    } finally {
      setTestingConnection(null);
    }
  };

  // API Key Management
  const handleAddKey = async () => {
    try {
      const validation = APIKeyManager.validateKeyFormat(
        keyFormData.apiKey,
        keyFormData.service
      );

      if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return;
      }

      await APIKeyManager.storeAPIKey(
        keyFormData.name,
        keyFormData.service,
        keyFormData.apiKey,
        keyFormData.rotationIntervalDays,
        user?.id || 'current-user',
        { addedVia: 'integrations-ui' }
      );

      setKeyFormData({
        name: '',
        service: 'gemini',
        apiKey: '',
        rotationIntervalDays: 90,
      });

      setShowAddKeyModal(false);
      await loadAPIKeys();
    } catch (error) {
      console.error('Failed to add API key:', error);
      alert('Failed to add API key');
    }
  };

  const handleRotateKey = async () => {
    if (!selectedKey) return;

    try {
      await APIKeyManager.rotateAPIKey(
        selectedKey.id,
        keyFormData.apiKey,
        user?.id || 'current-user'
      );

      setKeyFormData({ ...keyFormData, apiKey: '' });
      setShowRotateKeyModal(false);
      setSelectedKey(null);
      await loadAPIKeys();
    } catch (error) {
      console.error('Failed to rotate API key:', error);
      alert('Failed to rotate API key');
    }
  };

  const handleDeactivateKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to deactivate this API key?')) {
      return;
    }

    try {
      await APIKeyManager.deactivateAPIKey(keyId, user?.id || 'current-user');
      await loadAPIKeys();
    } catch (error) {
      console.error('Failed to deactivate API key:', error);
      alert('Failed to deactivate API key');
    }
  };

  const toggleShowKey = (keyId: string) => {
    setShowKeyValue(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  // Webhook Management
  const handleAddWebhook = async () => {
    try {
      const newWebhook: WebhookConfig = {
        id: `webhook-${Date.now()}`,
        name: webhookFormData.name,
        url: webhookFormData.url,
        events: webhookFormData.events,
        isActive: true,
        secret: webhookFormData.secret || `whsec_${Math.random().toString(36).substring(7)}`,
        successCount: 0,
        failureCount: 0,
      };

      setWebhooks(prev => [...prev, newWebhook]);
      setWebhookFormData({ name: '', url: '', events: [], secret: '' });
      setShowAddWebhookModal(false);
    } catch (error) {
      console.error('Failed to add webhook:', error);
      alert('Failed to add webhook');
    }
  };

  const handleToggleWebhook = async (webhookId: string) => {
    setWebhooks(prev => prev.map(wh => 
      wh.id === webhookId ? { ...wh, isActive: !wh.isActive } : wh
    ));
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }
    setWebhooks(prev => prev.filter(wh => wh.id !== webhookId));
  };

  const handleTestWebhook = async (webhookId: string) => {
    const webhook = webhooks.find(wh => wh.id === webhookId);
    if (!webhook) return;

    try {
      // Simulate webhook test
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Test payload sent to ${webhook.url}`);
    } catch (error) {
      alert('Failed to send test payload');
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge className="bg-green-500">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500">Degraded</Badge>;
      case 'down':
        return <Badge className="bg-red-500">Down</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const getReminderSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (!user || !hasPermission(user, Permission.ACCESS_AI_CONTROL_CENTER)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/ai-control-center')}
              >
                ←
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Integrations & API Management
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage AI service connections, API keys, and webhooks
                </p>
              </div>
            </div>

            <Button onClick={loadAllData} disabled={isLoading}>
              <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="connections">
              <Globe className="w-4 h-4 mr-2" />
              Connections
            </TabsTrigger>
            <TabsTrigger value="api-keys">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="webhooks">
              <Webhook className="w-4 h-4 mr-2" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="usage">
              <BarChart3 className="w-4 h-4 mr-2" />
              Usage Stats
            </TabsTrigger>
          </TabsList>

          {/* API Connections Tab */}
          <TabsContent value="connections" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">AI Service Connections</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor and test your AI service integrations
                </p>
              </div>
              <Button onClick={() => alert('Add new connection')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Connection
              </Button>
            </div>

            <div className="grid gap-4">
              {connections.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <Zap className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{connection.name}</h3>
                            {getHealthBadge(connection.health)}
                            <div className={cn('w-2 h-2 rounded-full', getStatusColor(connection.status))} />
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Endpoint</p>
                              <p className="font-mono text-xs">{connection.endpoint}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Response Time</p>
                              <p className="font-semibold">{connection.responseTime}ms</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Version</p>
                              <p className="font-semibold">{connection.version}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Last Checked</p>
                              <p className="text-xs">{connection.lastChecked.toLocaleTimeString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection(connection.id)}
                          disabled={testingConnection === connection.id}
                        >
                          <Activity className={cn('w-4 h-4 mr-2', testingConnection === connection.id && 'animate-pulse')} />
                          Test
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">API Key Management</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Secure storage and rotation of API keys
                </p>
              </div>
              <Button onClick={() => setShowAddKeyModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add API Key
              </Button>
            </div>

            {/* Rotation Reminders */}
            {rotationReminders.length > 0 && (
              <Card className={cn('border-l-4', getReminderSeverityColor(rotationReminders[0].severity))}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                        API Key Rotation Reminders
                      </h3>
                      <div className="mt-2 space-y-2">
                        {rotationReminders.map((reminder) => (
                          <div
                            key={reminder.keyId}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded"
                          >
                            <div>
                              <p className="font-medium">{reminder.keyName}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {reminder.service} •{' '}
                                {reminder.daysUntilRotation <= 0
                                  ? 'Overdue'
                                  : `${reminder.daysUntilRotation} days until rotation`}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                const key = apiKeys.find((k) => k.id === reminder.keyId);
                                setSelectedKey(key);
                                setShowRotateKeyModal(true);
                              }}
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Rotate
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* API Keys List */}
            <div className="grid gap-4">
              {apiKeys.map((key) => (
                <Card key={key.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                          <Key className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-semibold">{key.name}</h3>
                            <Badge variant="outline">{key.service}</Badge>
                            {key.isActive ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge className="bg-gray-500">Inactive</Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Created</p>
                              <p>{new Date(key.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Last Rotated</p>
                              <p>{new Date(key.lastRotated).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Next Rotation</p>
                              <p>{new Date(key.nextRotationDue).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Usage Count</p>
                              <p>{key.usageCount}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedKey(key);
                            setShowRotateKeyModal(true);
                          }}
                          disabled={!key.isActive}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivateKey(key.id)}
                          disabled={!key.isActive}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {apiKeys.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Key className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No API keys configured</p>
                    <Button className="mt-4" onClick={() => setShowAddKeyModal(true)}>
                      Add Your First API Key
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Webhook Configuration</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure webhooks for AI event notifications
                </p>
              </div>
              <Button onClick={() => setShowAddWebhookModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Webhook
              </Button>
            </div>

            <div className="grid gap-4">
              {webhooks.map((webhook) => (
                <Card key={webhook.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                          <Webhook className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{webhook.name}</h3>
                            {webhook.isActive ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge className="bg-gray-500">Inactive</Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-mono">
                            {webhook.url}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {webhook.events.map((event) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Success</p>
                              <p className="font-semibold text-green-600">{webhook.successCount}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Failures</p>
                              <p className="font-semibold text-red-600">{webhook.failureCount}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Last Triggered</p>
                              <p className="text-xs">
                                {webhook.lastTriggered 
                                  ? webhook.lastTriggered.toLocaleString()
                                  : 'Never'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestWebhook(webhook.id)}
                        >
                          <Activity className="w-4 h-4 mr-2" />
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleWebhook(webhook.id)}
                        >
                          {webhook.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWebhook(webhook.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {webhooks.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Webhook className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No webhooks configured</p>
                    <Button className="mt-4" onClick={() => setShowAddWebhookModal(true)}>
                      Add Your First Webhook
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Usage Stats Tab */}
          <TabsContent value="usage" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">API Usage Statistics</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor API usage by endpoint
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label>Version:</Label>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="v1">v1</option>
                  <option value="v2">v2 (Beta)</option>
                </select>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Calls</CardDescription>
                  <CardTitle className="text-3xl">
                    {usageStats.reduce((sum, stat) => sum + stat.calls, 0).toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>+12% from last week</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Avg Response Time</CardDescription>
                  <CardTitle className="text-3xl">
                    {Math.round(
                      usageStats.reduce((sum, stat) => sum + stat.avgResponseTime, 0) / 
                      usageStats.length
                    )}ms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Within SLA</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Error Rate</CardDescription>
                  <CardTitle className="text-3xl">
                    {(usageStats.reduce((sum, stat) => sum + stat.errorRate, 0) / 
                      usageStats.length * 100).toFixed(2)}%
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Below threshold</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Active Endpoints</CardDescription>
                  <CardTitle className="text-3xl">{usageStats.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Database className="w-4 h-4" />
                    <span>All operational</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Endpoint Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Endpoint Statistics</CardTitle>
                <CardDescription>Detailed usage metrics by endpoint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageStats.map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-mono text-sm mb-2">{stat.endpoint}</p>
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Calls: </span>
                            <span className="font-semibold">{stat.calls.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Avg Time: </span>
                            <span className="font-semibold">{stat.avgResponseTime}ms</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Error Rate: </span>
                            <span className={cn(
                              'font-semibold',
                              stat.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'
                            )}>
                              {(stat.errorRate * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Last Called: </span>
                            <span className="text-xs">{stat.lastCalled.toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* A/B Testing Section */}
            <Card>
              <CardHeader>
                <CardTitle>API Version A/B Testing</CardTitle>
                <CardDescription>Compare performance across API versions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Version v1 (Current)</h3>
                      <Badge>100% Traffic</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Response:</span>
                        <span className="font-semibold">145ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Error Rate:</span>
                        <span className="font-semibold text-green-600">0.02%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Satisfaction:</span>
                        <span className="font-semibold">98.5%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Version v2 (Beta)</h3>
                      <Badge variant="outline">0% Traffic</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Response:</span>
                        <span className="font-semibold">--</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Error Rate:</span>
                        <span className="font-semibold">--</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Satisfaction:</span>
                        <span className="font-semibold">--</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" size="sm">
                      Enable A/B Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add API Key Modal */}
      {showAddKeyModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowAddKeyModal(false)}
        >
          <Card className="max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Add API Key</CardTitle>
              <CardDescription>Securely store a new API key</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Key Name</Label>
                <Input
                  value={keyFormData.name}
                  onChange={(e) => setKeyFormData({ ...keyFormData, name: e.target.value })}
                  placeholder="e.g., Production Gemini Key"
                />
              </div>

              <div>
                <Label>Service</Label>
                <select
                  value={keyFormData.service}
                  onChange={(e) => setKeyFormData({ ...keyFormData, service: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={keyFormData.apiKey}
                  onChange={(e) => setKeyFormData({ ...keyFormData, apiKey: e.target.value })}
                  placeholder="Enter API key"
                />
              </div>

              <div>
                <Label>Rotation Interval (days)</Label>
                <Input
                  type="number"
                  value={keyFormData.rotationIntervalDays}
                  onChange={(e) =>
                    setKeyFormData({
                      ...keyFormData,
                      rotationIntervalDays: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddKey} className="flex-1">
                  Add Key
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddKeyModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rotate API Key Modal */}
      {showRotateKeyModal && selectedKey && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowRotateKeyModal(false)}
        >
          <Card className="max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Rotate API Key</CardTitle>
              <CardDescription>Replace the existing API key with a new one</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <Shield className="w-4 h-4 inline mr-1" />
                  This operation may require MFA verification
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Rotating key: <strong>{selectedKey.name}</strong>
                </p>
              </div>

              <div>
                <Label>New API Key</Label>
                <Input
                  type="password"
                  value={keyFormData.apiKey}
                  onChange={(e) => setKeyFormData({ ...keyFormData, apiKey: e.target.value })}
                  placeholder="Enter new API key"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleRotateKey} className="flex-1">
                  Rotate Key
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRotateKeyModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Webhook Modal */}
      {showAddWebhookModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowAddWebhookModal(false)}
        >
          <Card className="max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Add Webhook</CardTitle>
              <CardDescription>Configure a new webhook endpoint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Webhook Name</Label>
                <Input
                  value={webhookFormData.name}
                  onChange={(e) => setWebhookFormData({ ...webhookFormData, name: e.target.value })}
                  placeholder="e.g., AI Operation Complete"
                />
              </div>

              <div>
                <Label>Webhook URL</Label>
                <Input
                  value={webhookFormData.url}
                  onChange={(e) => setWebhookFormData({ ...webhookFormData, url: e.target.value })}
                  placeholder="https://example.com/webhooks/ai"
                />
              </div>

              <div>
                <Label>Events</Label>
                <div className="space-y-2 mt-2">
                  {['ai.operation.complete', 'ai.operation.error', 'ai.confidence.low', 'ai.cost.threshold'].map((event) => (
                    <label key={event} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={webhookFormData.events.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhookFormData({
                              ...webhookFormData,
                              events: [...webhookFormData.events, event],
                            });
                          } else {
                            setWebhookFormData({
                              ...webhookFormData,
                              events: webhookFormData.events.filter((e) => e !== event),
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Secret (optional)</Label>
                <Input
                  type="password"
                  value={webhookFormData.secret}
                  onChange={(e) => setWebhookFormData({ ...webhookFormData, secret: e.target.value })}
                  placeholder="Leave empty to auto-generate"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddWebhook} className="flex-1">
                  Add Webhook
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddWebhookModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
