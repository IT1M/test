// Corrective Action Tracking Service

import { db } from '@/lib/db/schema';
import type { Rejection, CorrectionAction } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';
import { suggestCorrectiveActions } from '@/services/gemini/defect-detection';

/**
 * Add corrective action to rejection
 */
export async function addCorrectiveAction(
  rejectionId: string,
  action: Omit<CorrectionAction, 'id'>
): Promise<void> {
  const rejection = await db.rejections.get(rejectionId);
  if (!rejection) {
    throw new Error('Rejection not found');
  }

  const newAction: CorrectionAction = {
    ...action,
    id: uuidv4(),
  };

  const updatedActions = [...rejection.correctionActions, newAction];

  await db.rejections.update(rejectionId, {
    correctionActions: updatedActions,
    updatedAt: new Date(),
  });

  // Log the action
  await db.systemLogs.add({
    id: uuidv4(),
    action: 'ADD_CORRECTIVE_ACTION',
    entityType: 'rejection',
    entityId: rejectionId,
    details: `Added corrective action: ${action.description}`,
    userId: action.assignedTo,
    timestamp: new Date(),
    status: 'success',
  });
}

/**
 * Update corrective action status
 */
export async function updateCorrectiveActionStatus(
  rejectionId: string,
  actionId: string,
  status: 'open' | 'in-progress' | 'completed' | 'verified',
  effectiveness?: number
): Promise<void> {
  const rejection = await db.rejections.get(rejectionId);
  if (!rejection) {
    throw new Error('Rejection not found');
  }

  const updatedActions = rejection.correctionActions.map(action => {
    if (action.id === actionId) {
      return {
        ...action,
        status,
        completedAt: status === 'completed' || status === 'verified' ? new Date() : action.completedAt,
        effectiveness: effectiveness !== undefined ? effectiveness : action.effectiveness,
      };
    }
    return action;
  });

  await db.rejections.update(rejectionId, {
    correctionActions: updatedActions,
    updatedAt: new Date(),
  });

  // Check if all actions are completed/verified
  const allCompleted = updatedActions.every(a => 
    a.status === 'completed' || a.status === 'verified'
  );

  // Update rejection status if all actions are completed
  if (allCompleted && rejection.status === 'corrective-action') {
    await db.rejections.update(rejectionId, {
      status: 'resolved',
      resolvedAt: new Date(),
    });
  }

  // Log the action
  await db.systemLogs.add({
    id: uuidv4(),
    action: 'UPDATE_CORRECTIVE_ACTION',
    entityType: 'rejection',
    entityId: rejectionId,
    details: `Updated corrective action status to ${status}`,
    userId: 'system',
    timestamp: new Date(),
    status: 'success',
  });
}

/**
 * Get corrective actions for rejection
 */
export async function getCorrectiveActions(rejectionId: string): Promise<CorrectionAction[]> {
  const rejection = await db.rejections.get(rejectionId);
  if (!rejection) {
    return [];
  }
  return rejection.correctionActions;
}

/**
 * Get all pending corrective actions
 */
export async function getPendingCorrectiveActions(): Promise<Array<{
  rejection: Rejection;
  action: CorrectionAction;
}>> {
  const rejections = await db.rejections
    .where('status')
    .anyOf(['under-review', 'corrective-action'])
    .toArray();

  const pendingActions: Array<{ rejection: Rejection; action: CorrectionAction }> = [];

  rejections.forEach(rejection => {
    rejection.correctionActions
      .filter(action => action.status === 'open' || action.status === 'in-progress')
      .forEach(action => {
        pendingActions.push({ rejection, action });
      });
  });

  return pendingActions;
}

/**
 * Get overdue corrective actions
 */
export async function getOverdueCorrectiveActions(): Promise<Array<{
  rejection: Rejection;
  action: CorrectionAction;
}>> {
  const now = new Date();
  const rejections = await db.rejections
    .where('status')
    .anyOf(['under-review', 'corrective-action'])
    .toArray();

  const overdueActions: Array<{ rejection: Rejection; action: CorrectionAction }> = [];

  rejections.forEach(rejection => {
    rejection.correctionActions
      .filter(action => 
        (action.status === 'open' || action.status === 'in-progress') &&
        new Date(action.dueDate) < now
      )
      .forEach(action => {
        overdueActions.push({ rejection, action });
      });
  });

  return overdueActions;
}

/**
 * Generate AI-suggested corrective actions for rejection
 */
export async function generateAICorrectiveActions(rejectionId: string): Promise<string[]> {
  const rejection = await db.rejections.get(rejectionId);
  if (!rejection) {
    throw new Error('Rejection not found');
  }

  // Get historical rejections for context
  const historicalRejections = await db.rejections
    .where('itemCode')
    .equals(rejection.itemCode)
    .and(r => r.id !== rejectionId)
    .toArray();

  // Use AI to suggest actions
  const suggestions = await suggestCorrectiveActions(rejection, historicalRejections);

  return suggestions;
}

/**
 * Create corrective actions from AI suggestions
 */
export async function createCorrectiveActionsFromAI(
  rejectionId: string,
  assignedTo: string,
  daysUntilDue: number = 30
): Promise<void> {
  const suggestions = await generateAICorrectiveActions(rejectionId);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysUntilDue);

  for (const suggestion of suggestions) {
    await addCorrectiveAction(rejectionId, {
      description: suggestion,
      assignedTo,
      dueDate,
      status: 'open',
    });
  }

  // Update rejection status
  await db.rejections.update(rejectionId, {
    status: 'corrective-action',
    updatedAt: new Date(),
  });
}

/**
 * Calculate corrective action effectiveness
 */
export async function calculateActionEffectiveness(
  rejectionId: string,
  actionId: string
): Promise<number> {
  const rejection = await db.rejections.get(rejectionId);
  if (!rejection) {
    return 0;
  }

  const action = rejection.correctionActions.find(a => a.id === actionId);
  if (!action || !action.completedAt) {
    return 0;
  }

  // Get rejections after action completion
  const afterRejections = await db.rejections
    .where('itemCode')
    .equals(rejection.itemCode)
    .and(r => 
      r.rejectionType === rejection.rejectionType &&
      new Date(r.rejectionDate) > action.completedAt!
    )
    .toArray();

  // Get rejections before action (same period length)
  const daysSinceCompletion = Math.floor(
    (new Date().getTime() - action.completedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  const beforeDate = new Date(action.completedAt);
  beforeDate.setDate(beforeDate.getDate() - daysSinceCompletion);

  const beforeRejections = await db.rejections
    .where('itemCode')
    .equals(rejection.itemCode)
    .and(r => 
      r.rejectionType === rejection.rejectionType &&
      new Date(r.rejectionDate) >= beforeDate &&
      new Date(r.rejectionDate) < action.completedAt!
    )
    .toArray();

  // Calculate effectiveness as reduction percentage
  const beforeCount = beforeRejections.length;
  const afterCount = afterRejections.length;

  if (beforeCount === 0) {
    return afterCount === 0 ? 100 : 0;
  }

  const reduction = ((beforeCount - afterCount) / beforeCount) * 100;
  return Math.max(0, Math.min(100, reduction));
}

/**
 * Generate CAPA (Corrective and Preventive Action) report
 */
export async function generateCAPAReport(rejectionId: string): Promise<{
  rejection: Rejection;
  correctiveActions: CorrectionAction[];
  effectiveness: Record<string, number>;
  recommendations: string[];
  status: string;
}> {
  const rejection = await db.rejections.get(rejectionId);
  if (!rejection) {
    throw new Error('Rejection not found');
  }

  // Calculate effectiveness for each completed action
  const effectiveness: Record<string, number> = {};
  for (const action of rejection.correctionActions) {
    if (action.status === 'completed' || action.status === 'verified') {
      effectiveness[action.id] = await calculateActionEffectiveness(rejectionId, action.id);
    }
  }

  // Generate recommendations based on effectiveness
  const recommendations: string[] = [];
  
  const avgEffectiveness = Object.values(effectiveness).length > 0
    ? Object.values(effectiveness).reduce((sum, val) => sum + val, 0) / Object.values(effectiveness).length
    : 0;

  if (avgEffectiveness < 50) {
    recommendations.push('Current corrective actions show low effectiveness. Consider alternative approaches.');
    recommendations.push('Conduct root cause analysis to identify underlying issues.');
  } else if (avgEffectiveness < 75) {
    recommendations.push('Corrective actions show moderate effectiveness. Monitor for continued improvement.');
  } else {
    recommendations.push('Corrective actions are highly effective. Document best practices for future use.');
  }

  // Check for recurring issues
  const similarRejections = await db.rejections
    .where('itemCode')
    .equals(rejection.itemCode)
    .and(r => 
      r.rejectionType === rejection.rejectionType &&
      new Date(r.rejectionDate) > new Date(rejection.rejectionDate)
    )
    .toArray();

  if (similarRejections.length > 0) {
    recommendations.push(`${similarRejections.length} similar rejection(s) occurred after corrective actions. Review and strengthen preventive measures.`);
  }

  // Determine overall status
  let status = 'In Progress';
  if (rejection.status === 'resolved' || rejection.status === 'closed') {
    status = avgEffectiveness >= 75 ? 'Effective' : 'Needs Review';
  }

  return {
    rejection,
    correctiveActions: rejection.correctionActions,
    effectiveness,
    recommendations,
    status,
  };
}

/**
 * Get CAPA statistics
 */
export async function getCAPAStatistics(): Promise<{
  totalActions: number;
  openActions: number;
  inProgressActions: number;
  completedActions: number;
  verifiedActions: number;
  overdueActions: number;
  avgEffectiveness: number;
}> {
  const rejections = await db.rejections.toArray();
  
  let totalActions = 0;
  let openActions = 0;
  let inProgressActions = 0;
  let completedActions = 0;
  let verifiedActions = 0;
  let overdueActions = 0;
  const effectivenessScores: number[] = [];

  const now = new Date();

  rejections.forEach(rejection => {
    rejection.correctionActions.forEach(action => {
      totalActions++;
      
      switch (action.status) {
        case 'open':
          openActions++;
          break;
        case 'in-progress':
          inProgressActions++;
          break;
        case 'completed':
          completedActions++;
          break;
        case 'verified':
          verifiedActions++;
          break;
      }

      if ((action.status === 'open' || action.status === 'in-progress') && 
          new Date(action.dueDate) < now) {
        overdueActions++;
      }

      if (action.effectiveness !== undefined) {
        effectivenessScores.push(action.effectiveness);
      }
    });
  });

  const avgEffectiveness = effectivenessScores.length > 0
    ? effectivenessScores.reduce((sum, val) => sum + val, 0) / effectivenessScores.length
    : 0;

  return {
    totalActions,
    openActions,
    inProgressActions,
    completedActions,
    verifiedActions,
    overdueActions,
    avgEffectiveness,
  };
}
