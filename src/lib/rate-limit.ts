import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  resetTime?: Date;
  remainingRequests?: number;
  message?: string;
}

// Rate limit configurations
export const RATE_LIMITS = {
  OTP_REQUEST: { windowMs: 60 * 1000, maxRequests: 1 }, // 1 OTP per minute
  LOGIN_ATTEMPT: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 login attempts per 15 minutes
  PASSWORD_RESET: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 password resets per hour
  EMAIL_VERIFICATION: { windowMs: 5 * 60 * 1000, maxRequests: 2 }, // 2 email verifications per 5 minutes
} as const;

export async function checkRateLimit(
  identifier: string,
  action: keyof typeof RATE_LIMITS,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const { windowMs, maxRequests } = config || RATE_LIMITS[action];
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    // Clean up expired rate limit entries
    await prisma.rateLimitLog.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });

    // Check current rate limit
    const existing = await prisma.rateLimitLog.findUnique({
      where: {
        identifier_action: {
          identifier,
          action
        }
      }
    });

    if (existing) {
      if (existing.windowStart > windowStart) {
        // Still within the rate limit window
        if (existing.count >= maxRequests) {
          return {
            success: false,
            resetTime: existing.expiresAt,
            remainingRequests: 0,
            message: `Rate limit exceeded. Try again after ${existing.expiresAt.toLocaleTimeString()}`
          };
        }

        // Increment the count
        const updated = await prisma.rateLimitLog.update({
          where: {
            identifier_action: {
              identifier,
              action
            }
          },
          data: {
            count: existing.count + 1
          }
        });

        return {
          success: true,
          resetTime: updated.expiresAt,
          remainingRequests: maxRequests - updated.count
        };
      } else {
        // Window has expired, reset the count
        const updated = await prisma.rateLimitLog.update({
          where: {
            identifier_action: {
              identifier,
              action
            }
          },
          data: {
            count: 1,
            windowStart: now,
            expiresAt: new Date(now.getTime() + windowMs)
          }
        });

        return {
          success: true,
          resetTime: updated.expiresAt,
          remainingRequests: maxRequests - 1
        };
      }
    } else {
      // First request, create new rate limit entry
      const newEntry = await prisma.rateLimitLog.create({
        data: {
          identifier,
          action,
          count: 1,
          windowStart: now,
          expiresAt: new Date(now.getTime() + windowMs)
        }
      });

      return {
        success: true,
        resetTime: newEntry.expiresAt,
        remainingRequests: maxRequests - 1
      };
    }
  } catch (error) {
    console.error('Rate limit check error:', error);
    // In case of database errors, allow the request but log the error
    return {
      success: true,
      message: 'Rate limit check failed, request allowed'
    };
  }
}

export async function resetRateLimit(identifier: string, action: keyof typeof RATE_LIMITS): Promise<void> {
  try {
    await prisma.rateLimitLog.delete({
      where: {
        identifier_action: {
          identifier,
          action
        }
      }
    });
  } catch (error) {
    // Ignore errors if record doesn't exist
    console.log(`Rate limit reset for ${identifier}:${action} (may not exist)`);
  }
}

export async function incrementFailedLoginAttempts(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true }
    });

    if (user) {
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const shouldLockAccount = newFailedAttempts >= 5;

      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: newFailedAttempts,
          accountLockedUntil: shouldLockAccount
            ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
            : undefined
        }
      });
    }
  } catch (error) {
    console.error('Failed to increment login attempts:', error);
  }
}

export async function resetFailedLoginAttempts(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to reset login attempts:', error);
  }
}

export async function isAccountLocked(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountLockedUntil: true }
    });

    if (user?.accountLockedUntil) {
      return user.accountLockedUntil > new Date();
    }

    return false;
  } catch (error) {
    console.error('Failed to check account lock status:', error);
    return false;
  }
}

// Cleanup function to remove expired rate limit entries
export async function cleanupExpiredRateLimits(): Promise<void> {
  try {
    const result = await prisma.rateLimitLog.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    console.log(`Cleaned up ${result.count} expired rate limit entries`);
  } catch (error) {
    console.error('Failed to cleanup expired rate limits:', error);
  }
}