// Security Integration Example
// Demonstrates how to integrate security features into AI operations

import { SecurityAuditLogger } from './security-audit-logger';
import { PHIPIIDetector } from './phi-pii-detector';
import { APIKeyManager } from './api-key-manager';
import { MFAService } from './mfa-service';

/**
 * Example: Secure AI Document Classification
 * 
 * This example shows how to:
 * 1. Detect and sanitize PHI/PII
 * 2. Log security audit events
 * 3. Use encrypted API keys
 * 4. Track data lineage
 */
export async function secureDocumentClassification(
  documentData: any,
  userId: string,
  userName: string,
  userRole: string
): Promise<{
  success: boolean;
  classification?: string;
  confidence?: number;
  sanitized: boolean;
  auditLogId?: string;
}> {
  try {
    // Step 1: Detect PHI/PII in document
    const phiDetection = PHIPIIDetector.detectPHI(documentData);
    
    if (phiDetection.containsPHI || phiDetection.containsPII) {
      console.log('PHI/PII detected:', phiDetection.detectedTypes);
      
      // Log PHI detection
      await SecurityAuditLogger.logAction({
        userId,
        userName,
        userRole,
        action: 'phi_detected',
        resourceType: 'document',
        resourceId: documentData.id || 'unknown',
        ipAddress: await SecurityAuditLogger.getClientIP(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        outcome: 'success',
        details: {
          detectedTypes: phiDetection.detectedTypes,
          redactedFields: phiDetection.redactedFields,
        },
        severity: 'high',
        requiresMFA: false,
        mfaVerified: false,
      });
    }
    
    // Step 2: Sanitize data before AI processing
    const sanitizedData = phiDetection.sanitizedData;
    
    // Step 3: Get API key securely
    const apiKey = await APIKeyManager.getAPIKey('gemini-production-key');
    
    if (!apiKey) {
      throw new Error('API key not found or inactive');
    }
    
    // Step 4: Perform AI classification (simulated)
    const classificationResult = {
      category: 'Medical Report',
      confidence: 0.87,
    };
    
    // Step 5: Log AI operation
    await SecurityAuditLogger.logModelAccess(
      userId,
      userName,
      userRole,
      'gemini-pro',
      'classify_document',
      'success'
    );
    
    // Step 6: Log successful operation
    await SecurityAuditLogger.logAction({
      userId,
      userName,
      userRole,
      action: 'document_classified',
      resourceType: 'document',
      resourceId: documentData.id || 'unknown',
      ipAddress: await SecurityAuditLogger.getClientIP(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      outcome: 'success',
      details: {
        classification: classificationResult.category,
        confidence: classificationResult.confidence,
        phiSanitized: phiDetection.containsPHI,
      },
      severity: 'medium',
      requiresMFA: false,
      mfaVerified: false,
    });
    
    return {
      success: true,
      classification: classificationResult.category,
      confidence: classificationResult.confidence,
      sanitized: phiDetection.containsPHI || phiDetection.containsPII,
    };
  } catch (error) {
    // Log failure
    await SecurityAuditLogger.logAction({
      userId,
      userName,
      userRole,
      action: 'document_classification_failed',
      resourceType: 'document',
      resourceId: documentData.id || 'unknown',
      ipAddress: await SecurityAuditLogger.getClientIP(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      outcome: 'failure',
      details: {
        error: (error as Error).message,
      },
      severity: 'high',
      requiresMFA: false,
      mfaVerified: false,
    });
    
    return {
      success: false,
      sanitized: false,
    };
  }
}

/**
 * Example: Secure Configuration Change with MFA
 * 
 * This example shows how to:
 * 1. Check if MFA is required
 * 2. Generate and verify MFA challenge
 * 3. Log configuration changes
 * 4. Create audit trail
 */
export async function secureConfigurationChange(
  userId: string,
  userName: string,
  userRole: string,
  settingName: string,
  oldValue: any,
  newValue: any
): Promise<{
  success: boolean;
  requiresMFA: boolean;
  challengeId?: string;
  message: string;
}> {
  // Step 1: Check if MFA is required (declare outside try block for catch access)
  const requiresMFA = MFAService.requiresMFA('change_security_settings');
  
  try {
    
    if (requiresMFA) {
      // Generate MFA challenge
      const { challengeId, code } = await MFAService.generateChallenge(
        userId,
        'change_security_settings'
      );
      
      // In production, send code via SMS/Email
      console.log(`MFA code sent to user: ${code}`);
      
      return {
        success: false,
        requiresMFA: true,
        challengeId,
        message: 'MFA verification required',
      };
    }
    
    // Step 2: Apply configuration change
    // (actual implementation would update the configuration)
    
    // Step 3: Log configuration change
    await SecurityAuditLogger.logConfigChange(
      userId,
      userName,
      userRole,
      settingName,
      oldValue,
      newValue,
      requiresMFA,
      false // MFA not verified in this path
    );
    
    return {
      success: true,
      requiresMFA: false,
      message: 'Configuration updated successfully',
    };
  } catch (error) {
    await SecurityAuditLogger.logAction({
      userId,
      userName,
      userRole,
      action: 'config_change_failed',
      resourceType: 'configuration',
      resourceId: settingName,
      ipAddress: await SecurityAuditLogger.getClientIP(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      outcome: 'failure',
      details: {
        error: (error as Error).message,
        settingName,
      },
      severity: 'critical',
      requiresMFA,
      mfaVerified: false,
    });
    
    return {
      success: false,
      requiresMFA: false,
      message: `Failed to update configuration: ${(error as Error).message}`,
    };
  }
}

/**
 * Example: Verify MFA and Complete Operation
 */
export async function verifyMFAAndCompleteOperation(
  challengeId: string,
  code: string,
  userId: string,
  userName: string,
  userRole: string,
  operation: () => Promise<void>
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Step 1: Verify MFA code
    const verificationResult = await MFAService.verifyCode(challengeId, code);
    
    if (!verificationResult.success) {
      // Log failed MFA attempt
      await SecurityAuditLogger.logAuthEvent(
        userId,
        userName,
        userRole,
        'mfa_failure',
        'failure'
      );
      
      return {
        success: false,
        message: verificationResult.message,
      };
    }
    
    // Step 2: Log successful MFA
    await SecurityAuditLogger.logAuthEvent(
      userId,
      userName,
      userRole,
      'mfa_success',
      'success'
    );
    
    // Step 3: Execute the operation
    await operation();
    
    return {
      success: true,
      message: 'Operation completed successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: `Operation failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Example: Secure Data Export with Audit Trail
 */
export async function secureDataExport(
  userId: string,
  userName: string,
  userRole: string,
  dataType: string,
  data: any[]
): Promise<{
  success: boolean;
  exportData?: any;
  exportSignature?: string;
}> {
  try {
    // Step 1: Check data for PHI/PII
    const sanitizedData = data.map(item => {
      const detection = PHIPIIDetector.detectPHI(item);
      return detection.sanitizedData;
    });
    
    // Step 2: Log data export
    await SecurityAuditLogger.logDataExport(
      userId,
      userName,
      userRole,
      dataType,
      data.length
    );
    
    // Step 3: Create export with tamper-proof signature
    const exportData = {
      data: sanitizedData,
      exportedBy: userName,
      exportedAt: new Date().toISOString(),
      recordCount: data.length,
      dataType,
    };
    
    // Step 4: Generate signature
    const { exportSignature } = await SecurityAuditLogger.exportAuditLogs({
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });
    
    return {
      success: true,
      exportData,
      exportSignature,
    };
  } catch (error) {
    await SecurityAuditLogger.logAction({
      userId,
      userName,
      userRole,
      action: 'data_export_failed',
      resourceType: dataType,
      resourceId: 'bulk',
      ipAddress: await SecurityAuditLogger.getClientIP(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      outcome: 'failure',
      details: {
        error: (error as Error).message,
        recordCount: data.length,
      },
      severity: 'high',
      requiresMFA: false,
      mfaVerified: false,
    });
    
    return {
      success: false,
    };
  }
}
