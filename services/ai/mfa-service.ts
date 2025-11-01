// Multi-Factor Authentication Service for Critical Operations
// Provides MFA verification for sensitive AI Control Center operations

import { generateId } from '@/lib/utils/generators';

export interface MFAChallenge {
  id: string;
  userId: string;
  operation: string;
  code: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

export interface MFAVerificationResult {
  success: boolean;
  challengeId: string;
  message: string;
}

export class MFAService {
  private static challenges: Map<string, MFAChallenge> = new Map();
  private static readonly CODE_LENGTH = 6;
  private static readonly CODE_EXPIRY_MINUTES = 5;
  
  /**
   * Generate MFA challenge for critical operation
   */
  static async generateChallenge(
    userId: string,
    operation: string
  ): Promise<{ challengeId: string; code: string }> {
    const challengeId = generateId();
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);
    
    const challenge: MFAChallenge = {
      id: challengeId,
      userId,
      operation,
      code,
      expiresAt,
      verified: false,
      createdAt: new Date(),
    };
    
    this.challenges.set(challengeId, challenge);
    
    // Clean up expired challenges
    this.cleanupExpiredChallenges();
    
    // In production, send code via SMS/Email
    console.log(`[MFA] Code for ${operation}: ${code}`);
    
    return { challengeId, code };
  }
  
  /**
   * Verify MFA code
   */
  static async verifyCode(
    challengeId: string,
    code: string
  ): Promise<MFAVerificationResult> {
    const challenge = this.challenges.get(challengeId);
    
    if (!challenge) {
      return {
        success: false,
        challengeId,
        message: 'Invalid or expired challenge',
      };
    }
    
    if (challenge.verified) {
      return {
        success: false,
        challengeId,
        message: 'Challenge already verified',
      };
    }
    
    if (new Date() > challenge.expiresAt) {
      this.challenges.delete(challengeId);
      return {
        success: false,
        challengeId,
        message: 'Challenge expired',
      };
    }
    
    if (challenge.code !== code) {
      return {
        success: false,
        challengeId,
        message: 'Invalid code',
      };
    }
    
    // Mark as verified
    challenge.verified = true;
    this.challenges.set(challengeId, challenge);
    
    return {
      success: true,
      challengeId,
      message: 'Verification successful',
    };
  }
  
  /**
   * Check if operation requires MFA
   */
  static requiresMFA(operation: string): boolean {
    const criticalOperations = [
      'rollback_config',
      'delete_model',
      'export_sensitive_data',
      'change_security_settings',
      'rotate_api_key',
      'disable_phi_sanitization',
      'bulk_delete',
      'change_rate_limits',
      'modify_budget',
    ];
    
    return criticalOperations.some(op => 
      operation.toLowerCase().includes(op.toLowerCase())
    );
  }
  
  /**
   * Generate random MFA code
   */
  private static generateCode(): string {
    let code = '';
    for (let i = 0; i < this.CODE_LENGTH; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }
  
  /**
   * Clean up expired challenges
   */
  private static cleanupExpiredChallenges(): void {
    const now = new Date();
    for (const [id, challenge] of this.challenges.entries()) {
      if (now > challenge.expiresAt) {
        this.challenges.delete(id);
      }
    }
  }
  
  /**
   * Get challenge status
   */
  static getChallengeStatus(challengeId: string): {
    exists: boolean;
    verified: boolean;
    expired: boolean;
  } {
    const challenge = this.challenges.get(challengeId);
    
    if (!challenge) {
      return { exists: false, verified: false, expired: false };
    }
    
    const expired = new Date() > challenge.expiresAt;
    
    return {
      exists: true,
      verified: challenge.verified,
      expired,
    };
  }
  
  /**
   * Invalidate challenge
   */
  static invalidateChallenge(challengeId: string): void {
    this.challenges.delete(challengeId);
  }
}
