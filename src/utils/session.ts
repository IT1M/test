/**
 * Session Management Utilities
 */

import { auth } from '@/services/auth';
import { prisma } from '@/services/prisma';

/**
 * Check if user session is still valid
 * Validates that the user account is still active
 * @param userId - User ID from session
 * @returns True if session is valid
 */
export async function isSessionValid(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });

    return user?.isActive ?? false;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
}

/**
 * Get session with validation
 * Returns session only if user is still active
 */
export async function getValidatedSession() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const isValid = await isSessionValid(session.user.id);

  if (!isValid) {
    return null;
  }

  return session;
}

/**
 * Session timeout configuration
 */
export const SESSION_CONFIG = {
  maxAge: 30 * 60, // 30 minutes in seconds
  updateAge: 5 * 60, // Update session every 5 minutes
  warningTime: 5 * 60, // Show warning 5 minutes before expiry
};

/**
 * Calculate session expiry time
 * @param sessionStart - Session start timestamp
 * @returns Expiry timestamp
 */
export function getSessionExpiry(sessionStart: number): number {
  return sessionStart + SESSION_CONFIG.maxAge * 1000;
}

/**
 * Check if session is about to expire
 * @param sessionStart - Session start timestamp
 * @returns True if session will expire soon
 */
export function isSessionExpiringSoon(sessionStart: number): boolean {
  const now = Date.now();
  const expiry = getSessionExpiry(sessionStart);
  const warningThreshold = expiry - SESSION_CONFIG.warningTime * 1000;

  return now >= warningThreshold && now < expiry;
}

/**
 * Check if session has expired
 * @param sessionStart - Session start timestamp
 * @returns True if session has expired
 */
export function isSessionExpired(sessionStart: number): boolean {
  const now = Date.now();
  const expiry = getSessionExpiry(sessionStart);

  return now >= expiry;
}
