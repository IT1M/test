  /**
   * Export activity logs
   */
  static async exportLogs(
    filters: any,
    format: 'csv' | 'json' | 'excel'
  ): Promise<Blob> {
    const { logs } = await this.getActivityLogs({ ...filters, pageSize: 10000 });
    
    if (format === 'json') {
      return new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    }
    
    if (format === 'csv') {
      const csv = this.convertToCSV(logs);
      return new Blob([csv], { type: 'text/csv' });
    }
    
    // Excel format would use a library like xlsx
    throw new Error('Excel export not yet implemented');
  }
  
  /**
   * Detect anomalous activity
   */
  private static async checkForAnomalies(log: AIActivityLog) {
    // Check for repeated low confidence
    const recentLogs = await db.aiActivityLog
      .where('modelName').equals(log.modelName)
      .and(l => l.timestamp > new Date(Date.now() - 3600000)) // Last hour
      .toArray();
    
    const lowConfidenceCount = recentLogs.filter(l => l.confidenceScore < 0.5).length;
    
    if (lowConfidenceCount > 10) {
      await AlertManager.createAlert({
        type: 'anomaly',
        severity: 'high',
        title: `High number of low confidence results for ${log.modelName}`,
        description: `${lowConfidenceCount} operations with confidence < 0.5 in the last hour`,
        modelName: log.modelName
      });
    }
    
    // Check for unusual input patterns
    if (log.sensitiveFlag && log.status === 'success') {
      await AlertManager.createAlert({
        type: 'security',
        severity: 'critical',
        title: 'PHI detected in AI operation',
        description: `Sensitive data was processed by ${log.modelName}`,
        modelName: log.modelName,
        logId: log.id
      });
    }
  }
  
  private static sanitizePHI(data: any): any {
    // Implementation of PHI sanitization
    // Remove names, IDs, dates, etc.
    return data; // Placeholder
  }
  
  private static detectPHI(data: any): boolean {
    // Implementation of PHI detection
    return false; // Placeholder
  }
  
  private static createHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  private static estimateCost(modelName: string, input: any, output: any): number {
    // Rough estimation based on tokens
    const inputTokens = JSON.stringify(input).length / 4;
    const outputTokens = JSON.stringify(output).length / 4;
    const costPerToken = 0.00001; // Example rate
    return (inputTokens + outputTokens) * costPerToken;
  }
  
  private static async updateMetrics(modelName: string, log: AIActivityLog) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existing = await db.aiModelMetrics
      .where(['modelName', 'date'])
      .equals([modelName, today])
      .first();
    
    if (existing) {
      // Update existing metrics
      await db.aiModelMetrics.update(existing.id, {
        totalCalls: existing.totalCalls + 1,
        successfulCalls: existing.successfulCalls + (log.status === 'success' ? 1 : 0),
        failedCalls: existing.failedCalls + (log.status === 'error' ? 1 : 0),
        avgResponseTime: (existing.avgResponseTime * existing.totalCalls + log.executionTime) / (existing.totalCalls + 1),
        avgConfidence: (existing.avgConfidence * existing.totalCalls + log.confidenceScore) / (existing.totalCalls + 1),
        totalCost: existing.totalCost + log.costEstimate
      });
    } else {
      // Create new metrics entry
      await db.aiModelMetrics.add({
        id: generateId(),
        modelName,
        date: today,
        totalCalls: 1,
        successfulCalls: log.status === 'success' ? 1 : 0,
        failedCalls: log.status === 'error' ? 1 : 0,
        timeoutCalls: log.status === 'timeout' ? 1 : 0,
        avgResponseTime: log.executionTime,
        p95ResponseTime: log.executionTime,
        p99ResponseTime: log.executionTime,
        avgConfidence: log.confidenceScore,
        minConfidence: log.confidenceScore,
        maxConfidence: log.confidenceScore,
        totalCost: log.costEstimate,
        totalTokens: 0,
        errorRate: log.status === 'error' ? 100 : 0,
        createdAt: new Date()
      });
    }
  }
  
  private static convertToCSV(logs: AIActivityLog[]): string {
    const headers = ['Timestamp', 'Model', 'Operation', 'Confidence', 'Duration (ms)', 'Status', 'Cost'];
    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.modelName,
      log.operationType,
      log.confidenceScore.toFixed(2),
      log.executionTime.toString(),
      log.status,
      log.costEstimate.toFixed(4)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}
```

### Configuration Manager Service

```typescript
// services/ai/config-manager.ts
export class AIConfigurationManager {
  /**
   * Get current AI configuration
   */
  static async getCurrentConfig(): Promise<AIConfiguration> {
    // Load from database or cache
    const config = await db.aiConfiguration.toArray();
    return this.parseConfig(config);
  }
  
  /**
   * Update AI configuration with audit trail
   */
  static async updateConfig(
    userId: string,
    settingName: string,
    newValue: any,
    reason: string,
    requiresApproval: boolean = false
  ): Promise<void> {
    const oldValue = await this.getConfigValue(settingName);
    
    // Create history entry
    await db.aiConfigurationHistory.add({
      id: generateId(),
      timestamp: new Date(),
      userId,
      settingName,
      oldValue,
      newValue,
      reason,
      approvedBy: requiresApproval ? null : userId,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      createdAt: new Date()
    });
    
    // Apply configuration
    if (!requiresApproval) {
      await this.applyConfig(settingName, newValue);
    }
    
    // Log to security audit
    await db.securityAuditLog.add({
      id: generateId(),
      timestamp: new Date(),
      userId,
      action: 'update_ai_config',
      resourceAffected: settingName,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      outcome: 'success',
      details: { oldValue, newValue, reason },
      severity: this.getChangeSeverity(settingName),
      requiresMFA: requiresApproval,
      mfaVerified: false,
      createdAt: new Date()
    });
  }
