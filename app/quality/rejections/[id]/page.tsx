'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getRejectionById } from '@/services/database/rejections';
import { 
  addCorrectiveAction, 
  updateCorrectiveActionStatus,
  generateAICorrectiveActions,
  generateCAPAReport 
} from '@/services/database/corrective-actions';
import type { Rejection, CorrectionAction } from '@/types/database';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function RejectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [rejection, setRejection] = useState<Rejection | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddAction, setShowAddAction] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [capaReport, setCAPAReport] = useState<any>(null);

  const [newAction, setNewAction] = useState({
    description: '',
    assignedTo: 'current-user',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    loadRejection();
  }, [id]);

  const loadRejection = async () => {
    try {
      setLoading(true);
      const data = await getRejectionById(id);
      setRejection(data || null);
    } catch (error) {
      console.error('Error loading rejection:', error);
      toast.error('Failed to load rejection');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAction = async () => {
    if (!newAction.description) {
      toast.error('Please enter action description');
      return;
    }

    try {
      await addCorrectiveAction(id, {
        description: newAction.description,
        assignedTo: newAction.assignedTo,
        dueDate: new Date(newAction.dueDate),
        status: 'open',
      });

      toast.success('Corrective action added');
      setShowAddAction(false);
      setNewAction({
        description: '',
        assignedTo: 'current-user',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      loadRejection();
    } catch (error) {
      console.error('Error adding action:', error);
      toast.error('Failed to add action');
    }
  };

  const handleUpdateActionStatus = async (
    actionId: string,
    status: 'open' | 'in-progress' | 'completed' | 'verified'
  ) => {
    try {
      await updateCorrectiveActionStatus(id, actionId, status);
      toast.success('Action status updated');
      loadRejection();
    } catch (error) {
      console.error('Error updating action:', error);
      toast.error('Failed to update action');
    }
  };

  const handleGenerateAISuggestions = async () => {
    try {
      setLoadingAI(true);
      const suggestions = await generateAICorrectiveActions(id);
      setAiSuggestions(suggestions);
      toast.success('AI suggestions generated');
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleUseSuggestion = (suggestion: string) => {
    setNewAction(prev => ({ ...prev, description: suggestion }));
    setShowAddAction(true);
  };

  const handleGenerateCAPAReport = async () => {
    try {
      const report = await generateCAPAReport(id);
      setCAPAReport(report);
      toast.success('CAPA report generated');
    } catch (error) {
      console.error('Error generating CAPA report:', error);
      toast.error('Failed to generate CAPA report');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'verified':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading rejection details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!rejection) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">Rejection not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{rejection.rejectionId}</h1>
            <p className="text-gray-600 mt-1">
              {format(new Date(rejection.rejectionDate), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateCAPAReport}>
            <FileText className="h-4 w-4 mr-2" />
            CAPA Report
          </Button>
        </div>
      </div>

      {/* Status and Severity */}
      <div className="flex gap-2">
        <Badge className={`capitalize ${getSeverityColor(rejection.severity)}`}>
          {rejection.severity} Severity
        </Badge>
        <Badge className="capitalize" variant="outline">
          {rejection.rejectionType}
        </Badge>
        <Badge className={getStatusColor(rejection.status)}>
          {rejection.status.replace('-', ' ')}
        </Badge>
      </div>

      {/* Rejection Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Rejection Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Item Code</p>
            <p className="font-mono font-semibold">{rejection.itemCode}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Batch Number</p>
            <p className="font-mono">{rejection.batchNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Lot Number</p>
            <p className="font-mono">{rejection.lotNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Machine</p>
            <p>{rejection.machineName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Quantity</p>
            <p className="font-semibold">{rejection.quantity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Cost Impact</p>
            <p className="font-semibold text-red-600">${rejection.costImpact.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">Rejection Reason</p>
          <p className="mt-1">{rejection.rejectionReason}</p>
        </div>
      </Card>

      {/* Images */}
      {rejection.images && rejection.images.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Defect Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rejection.images.map(image => (
              <div key={image.id} className="relative">
                <img
                  src={image.url}
                  alt={image.fileName}
                  className="w-full h-40 object-cover rounded border"
                />
                {image.analysisResults && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2">
                    <p>{image.analysisResults.defectType}</p>
                    <p>{image.analysisResults.confidence}% confidence</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Analysis */}
      {rejection.geminiAnalysis && (
        <Card className="p-6 bg-blue-50">
          <h2 className="text-xl font-semibold mb-4">AI Analysis</h2>
          <div className="space-y-2">
            <p><strong>Defect Type:</strong> {rejection.geminiAnalysis.defectType}</p>
            <p><strong>Confidence:</strong> {rejection.geminiAnalysis.confidence}%</p>
            {rejection.geminiAnalysis.suggestedActions && (
              <div>
                <p className="font-semibold mb-2">Suggested Actions:</p>
                <ul className="list-disc list-inside space-y-1">
                  {rejection.geminiAnalysis.suggestedActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Corrective Actions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Corrective Actions</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAISuggestions}
              disabled={loadingAI}
            >
              {loadingAI ? 'Generating...' : 'AI Suggestions'}
            </Button>
            <Dialog open={showAddAction} onOpenChange={setShowAddAction}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Corrective Action</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newAction.description}
                      onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                      placeholder="Describe the corrective action"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Assigned To</Label>
                    <Input
                      value={newAction.assignedTo}
                      onChange={(e) => setNewAction({ ...newAction, assignedTo: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={newAction.dueDate}
                      onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddAction(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddAction}>Add Action</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded">
            <p className="font-semibold mb-2">AI-Generated Suggestions:</p>
            <div className="space-y-2">
              {aiSuggestions.map((suggestion, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <p className="text-sm flex-1">{i + 1}. {suggestion}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUseSuggestion(suggestion)}
                  >
                    Use
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions List */}
        {rejection.correctionActions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No corrective actions yet</p>
        ) : (
          <div className="space-y-3">
            {rejection.correctionActions.map(action => (
              <div key={action.id} className="border rounded p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{action.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>Assigned to: {action.assignedTo}</span>
                      <span>Due: {format(new Date(action.dueDate), 'MMM dd, yyyy')}</span>
                      {action.effectiveness !== undefined && (
                        <span className="text-green-600">
                          Effectiveness: {action.effectiveness}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(action.status)}>
                      {action.status}
                    </Badge>
                    <Select
                      value={action.status}
                      onValueChange={(value: any) => handleUpdateActionStatus(action.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* CAPA Report */}
      {capaReport && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">CAPA Report</h2>
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Status: {capaReport.status}</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Effectiveness Scores:</p>
              {Object.entries(capaReport.effectiveness).map(([actionId, score]: [string, any]) => {
                const action = capaReport.correctiveActions.find((a: CorrectionAction) => a.id === actionId);
                return (
                  <div key={actionId} className="flex justify-between items-center py-1">
                    <span className="text-sm">{action?.description.substring(0, 50)}...</span>
                    <span className="font-semibold">{score}%</span>
                  </div>
                );
              })}
            </div>
            <div>
              <p className="font-semibold mb-2">Recommendations:</p>
              <ul className="list-disc list-inside space-y-1">
                {capaReport.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm">{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
