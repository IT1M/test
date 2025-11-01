'use client';

// API Key Management Component
// Secure management of API keys with rotation reminders

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { APIKeyManager } from '@/services/ai/api-key-manager';
import { MFAService } from '@/services/ai/mfa-service';

export default function APIKeyManagement() {
  const [keys, setKeys] = useState<any[]>([]);
  const [rotationReminders, setRotationReminders] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<any>(null);
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaChallengeId, setMfaChallengeId] = useState('');
  const [pendingOperation, setPendingOperation] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    service: 'gemini',
    apiKey: '',
    rotationIntervalDays: 90,
  });

  useEffect(() => {
    loadKeys();
    loadRotationReminders();
  }, []);

  const loadKeys = async () => {
    const keyList = await APIKeyManager.listAPIKeys();
    setKeys(keyList);
  };

  const loadRotationReminders = async () => {
    const reminders = await APIKeyManager.getRotationReminders();
    setRotationReminders(reminders);
  };

  const handleAddKey = async () => {
    try {
      // Validate
      const validation = APIKeyManager.validateKeyFormat(
        formData.apiKey,
        formData.service
      );

      if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return;
      }

      // Store key
      await APIKeyManager.storeAPIKey(
        formData.name,
        formData.service,
        formData.apiKey,
        formData.rotationIntervalDays,
        'current-user', // Replace with actual user ID
        { addedVia: 'ui' }
      );

      // Reset form
      setFormData({
        name: '',
        service: 'gemini',
        apiKey: '',
        rotationIntervalDays: 90,
      });

      setShowAddModal(false);
      loadKeys();
      loadRotationReminders();
    } catch (error) {
      console.error('Failed to add API key:', error);
      alert('Failed to add API key');
    }
  };

  const handleRotateKey = async () => {
    if (!selectedKey) return;

    // Check if MFA is required
    if (MFAService.requiresMFA('rotate_api_key')) {
      // Generate MFA challenge
      const { challengeId, code } = await MFAService.generateChallenge(
        'current-user',
        'rotate_api_key'
      );

      setMfaChallengeId(challengeId);
      setPendingOperation({
        type: 'rotate',
        keyId: selectedKey.id,
        newKey: formData.apiKey,
      });
      setShowRotateModal(false);
      setShowMFAModal(true);

      // In development, show the code
      alert(`MFA Code (dev only): ${code}`);
      return;
    }

    // Proceed without MFA
    await executeRotation(selectedKey.id, formData.apiKey);
  };

  const executeRotation = async (keyId: string, newKey: string) => {
    try {
      await APIKeyManager.rotateAPIKey(keyId, newKey, 'current-user');

      setFormData({ ...formData, apiKey: '' });
      setShowRotateModal(false);
      setSelectedKey(null);
      loadKeys();
      loadRotationReminders();
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
      await APIKeyManager.deactivateAPIKey(keyId, 'current-user');
      loadKeys();
      loadRotationReminders();
    } catch (error) {
      console.error('Failed to deactivate API key:', error);
      alert('Failed to deactivate API key');
    }
  };

  const handleMFAVerify = async () => {
    const result = await MFAService.verifyCode(mfaChallengeId, mfaCode);

    if (result.success) {
      // Execute pending operation
      if (pendingOperation?.type === 'rotate') {
        await executeRotation(pendingOperation.keyId, pendingOperation.newKey);
      }

      setShowMFAModal(false);
      setMfaCode('');
      setMfaChallengeId('');
      setPendingOperation(null);
    } else {
      alert(result.message);
    }
  };

  const getReminderSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Key Management</h2>
          <p className="text-gray-600">
            Secure storage and rotation of API keys
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add API Key
        </Button>
      </div>

      {/* Rotation Reminders */}
      {rotationReminders.length > 0 && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900">
                API Key Rotation Reminders
              </h3>
              <div className="mt-2 space-y-2">
                {rotationReminders.map((reminder) => (
                  <div
                    key={reminder.keyId}
                    className="flex items-center justify-between p-2 bg-white rounded"
                  >
                    <div>
                      <p className="font-medium">{reminder.keyName}</p>
                      <p className="text-sm text-gray-600">
                        {reminder.service} •{' '}
                        {reminder.daysUntilRotation <= 0
                          ? 'Overdue'
                          : `${reminder.daysUntilRotation} days until rotation`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getReminderSeverityColor(reminder.severity)}>
                        {reminder.severity}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => {
                          const key = keys.find((k) => k.id === reminder.keyId);
                          setSelectedKey(key);
                          setShowRotateModal(true);
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Rotate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* API Keys List */}
      <div className="grid gap-4">
        {keys.map((key) => (
          <Card key={key.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-blue-100 rounded">
                  <Key className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{key.name}</h3>
                    <Badge variant="outline">{key.service}</Badge>
                    {key.isActive ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-500">Inactive</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p>{new Date(key.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Last Rotated</p>
                      <p>{new Date(key.lastRotated).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Next Rotation</p>
                      <p>{new Date(key.nextRotationDue).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Usage Count</p>
                      <p>{key.usageCount}</p>
                    </div>
                  </div>

                  {key.lastUsed && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last used: {new Date(key.lastUsed).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedKey(key);
                    setShowRotateModal(true);
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
          </Card>
        ))}

        {keys.length === 0 && (
          <Card className="p-8 text-center">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No API keys configured</p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              Add Your First API Key
            </Button>
          </Card>
        )}
      </div>

      {/* Add Key Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <Card
            className="max-w-md w-full m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Add API Key</h3>

              <div className="space-y-4">
                <div>
                  <Label>Key Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Production Gemini Key"
                  />
                </div>

                <div>
                  <Label>Service</Label>
                  <select
                    value={formData.service}
                    onChange={(e) =>
                      setFormData({ ...formData, service: e.target.value })
                    }
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
                    value={formData.apiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, apiKey: e.target.value })
                    }
                    placeholder="Enter API key"
                  />
                </div>

                <div>
                  <Label>Rotation Interval (days)</Label>
                  <Input
                    type="number"
                    value={formData.rotationIntervalDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rotationIntervalDays: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button onClick={handleAddKey} className="flex-1">
                  Add Key
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Rotate Key Modal */}
      {showRotateModal && selectedKey && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowRotateModal(false)}
        >
          <Card
            className="max-w-md w-full m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Rotate API Key</h3>

              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <Shield className="w-4 h-4 inline mr-1" />
                  This operation requires MFA verification
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Rotating key: <strong>{selectedKey.name}</strong>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>New API Key</Label>
                  <Input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, apiKey: e.target.value })
                    }
                    placeholder="Enter new API key"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button onClick={handleRotateKey} className="flex-1">
                  Rotate Key
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRotateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MFA Modal */}
      {showMFAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full m-4">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">MFA Verification Required</h3>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  Enter the 6-digit code sent to your device
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Verification Code</Label>
                  <Input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button onClick={handleMFAVerify} className="flex-1">
                  Verify
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMFAModal(false);
                    setMfaCode('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
