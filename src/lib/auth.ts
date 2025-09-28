import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { validateInput, phoneSchema, emailSchema, passwordSchema, generateSecureToken, normalizePhoneNumber } from './validation';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  isSecretary?: boolean;
  sessionId?: string;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  message?: string;
}

// Environment validation
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'your-secret-key') {
    throw new Error('JWT_SECRET environment variable must be set to a secure value');
  }
  return secret;
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
  const payload = {
    userId: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
    sessionId: crypto.randomUUID()
  };

  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  } as jwt.SignOptions);
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as jwt.JwtPayload & {
      userId: string;
      email?: string;
      phone?: string;
      role: UserRole;
      sessionId: string;
    };
    return {
      id: decoded.userId,
      email: decoded.email,
      phone: decoded.phone,
      role: decoded.role,
      sessionId: decoded.sessionId
    };
  } catch (error) {
    return null;
  }
}

// Email/Password login for Admin, Society Admin (with role requirement)
export async function loginWithEmailPassword(
  email: string,
  password: string,
  role: UserRole,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> {
  try {
    // Validate input
    const validatedEmail = validateInput(emailSchema, email);
    const validatedPassword = validateInput(passwordSchema, password);


    const user = await prisma.user.findFirst({
      where: {
        email: validatedEmail,
        role,
        status: 'ACTIVE'
      }
    });

    if (!user || !user.password) {
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          details: { email: validatedEmail, reason: 'User not found or no password' },
          ipAddress,
          userAgent
        }
      });
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }


    const isValidPassword = await bcrypt.compare(validatedPassword, user.password);
    if (!isValidPassword) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          details: { email: validatedEmail, reason: 'Invalid password' },
          ipAddress,
          userAgent
        }
      });
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }


    const authUser: AuthUser = {
      id: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      isSecretary: user.isSecretary,
    };

    const token = generateToken(authUser);

    // Create session
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress,
        userAgent
      }
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        details: { email: validatedEmail },
        ipAddress,
        userAgent
      }
    });

    return {
      success: true,
      user: authUser,
      token
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    };
  }
}

// Email/Password login with automatic role detection (improved version)
export async function loginWithEmailOnly(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> {
  try {
    // Validate input
    const validatedEmail = validateInput(emailSchema, email);
    const validatedPassword = validateInput(passwordSchema, password);

    // Find user by email only, let the system determine the role
    const user = await prisma.user.findFirst({
      where: {
        email: validatedEmail,
        status: 'ACTIVE',
        // Exclude MEMBER role since they use OTP login
        role: {
          in: ['ADMIN', 'SOCIETY_ADMIN']
        }
      }
    });

    if (!user || !user.password) {
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          details: { email: validatedEmail, reason: 'User not found or no password' },
          ipAddress,
          userAgent
        }
      });
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }


    const isValidPassword = await bcrypt.compare(validatedPassword, user.password);
    if (!isValidPassword) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          details: { email: validatedEmail, reason: 'Invalid password' },
          ipAddress,
          userAgent
        }
      });
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }


    const authUser: AuthUser = {
      id: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      isSecretary: user.isSecretary,
    };

    const token = generateToken(authUser);

    // Create session
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress,
        userAgent
      }
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        details: { email: validatedEmail },
        ipAddress,
        userAgent
      }
    });

    return {
      success: true,
      user: authUser,
      token
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    };
  }
}

// Generate OTP for member login using Firebase
export async function generateOTP(
  phone: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> {
  try {
    // Validate and normalize phone number
    const validatedPhone = validateInput(phoneSchema, phone);
    const normalizedPhone = normalizePhoneNumber(validatedPhone);


    // Check if user exists in database first
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (!user) {
      return {
        success: false,
        message: 'Phone number not registered. Please contact admin for registration.'
      };
    }

    if (user.status !== 'ACTIVE') {
      return {
        success: false,
        message: 'Account is not active. Please contact admin.'
      };
    }

    // Log OTP request for tracking
    await prisma.oTPLog.create({
      data: {
        phone: normalizedPhone,
        otpCode: 'FIREBASE_OTP', // Placeholder since Firebase handles OTP
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        ipAddress,
        userAgent
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'OTP_REQUEST',
        details: { phone: normalizedPhone },
        ipAddress,
        userAgent
      }
    });

    return {
      success: true,
      message: 'User verified. Proceed with OTP verification on client side.'
    };
  } catch (error) {
    console.error('OTP generation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to initiate OTP process'
    };
  }
}

// Verify OTP for member login (Firebase handles verification on client side)
export async function verifyOTP(
  phone: string,
  firebaseUid: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> {
  try {
    // Validate and normalize phone number
    const validatedPhone = validateInput(phoneSchema, phone);
    const normalizedPhone = normalizePhoneNumber(validatedPhone);

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    if (user.status !== 'ACTIVE') {
      return {
        success: false,
        message: 'Account is not active'
      };
    }

    // Update user with Firebase UID and mark as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isOtpVerified: true,
        firebaseUid: firebaseUid,
        lastLoginAt: new Date()
      }
    });

    // Mark OTP as used in log
    await prisma.oTPLog.updateMany({
      where: {
        phone: normalizedPhone,
        isUsed: false
      },
      data: {
        isUsed: true
      }
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      isSecretary: user.isSecretary,
    };

    const token = generateToken(authUser);

    // Create session
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress,
        userAgent
      }
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'OTP_LOGIN_SUCCESS',
        details: { phone: normalizedPhone, firebaseUid },
        ipAddress,
        userAgent
      }
    });

    return {
      success: true,
      user: authUser,
      token
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    };
  }
}

// Request password reset
export async function requestPasswordReset(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> {
  try {
    // Validate email
    const validatedEmail = validateInput(emailSchema, email);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedEmail }
    });

    // Don't reveal if user exists or not for security
    if (!user || user.role === 'MEMBER') {
      return {
        success: true,
        message: 'If the email exists in our system, you will receive a password reset link.'
      };
    }

    // Generate secure reset token
    const resetToken = generateSecureToken(32);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUEST',
        details: { email: validatedEmail },
        ipAddress,
        userAgent
      }
    });

    return {
      success: true,
      message: 'If the email exists in our system, you will receive a password reset link.',
      token: resetToken // This should be sent via email, not returned in API
    };
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process password reset request'
    };
  }
}

// Reset password with token
export async function resetPassword(
  token: string,
  newPassword: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> {
  try {
    // Validate new password
    const validatedPassword = validateInput(passwordSchema, newPassword);

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return {
        success: false,
        message: 'Invalid or expired reset token'
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedPassword, 12);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        failedLoginAttempts: 0, // Reset failed attempts
        accountLockedUntil: null // Unlock account if locked
      }
    });

    // Invalidate all existing sessions
    await prisma.userSession.updateMany({
      where: { userId: user.id },
      data: { isActive: false }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_SUCCESS',
        details: { email: user.email },
        ipAddress,
        userAgent
      }
    });

    return {
      success: true,
      message: 'Password reset successfully. Please log in with your new password.'
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to reset password'
    };
  }
}

// Verify email functionality
export async function requestEmailVerification(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.email) {
      return {
        success: false,
        message: 'User not found or no email address'
      };
    }

    if (user.isEmailVerified) {
      return {
        success: true,
        message: 'Email is already verified'
      };
    }

    // Generate verification token
    const verificationToken = generateSecureToken(32);

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: verificationToken
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_VERIFICATION_REQUEST',
        details: { email: user.email },
        ipAddress,
        userAgent
      }
    });

    return {
      success: true,
      message: 'Verification email sent',
      token: verificationToken // This should be sent via email
    };
  } catch (error) {
    console.error('Email verification request error:', error);
    return {
      success: false,
      message: 'Failed to send verification email'
    };
  }
}

// Verify email with token
export async function verifyEmail(
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token
      }
    });

    if (!user) {
      return {
        success: false,
        message: 'Invalid verification token'
      };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_VERIFICATION_SUCCESS',
        details: { email: user.email },
        ipAddress,
        userAgent
      }
    });

    return {
      success: true,
      message: 'Email verified successfully'
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      success: false,
      message: 'Failed to verify email'
    };
  }
}

// Create admin user (for initial setup)
export async function createAdminUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<LoginResult> {
  try {
    // Validate inputs
    const validatedEmail = validateInput(emailSchema, email);
    const validatedPassword = validateInput(passwordSchema, password);

    const hashedPassword = await bcrypt.hash(validatedPassword, 12);

    const user = await prisma.user.create({
      data: {
        email: validatedEmail,
        password: hashedPassword,
        role: 'ADMIN',
        firstName,
        lastName,
        isEmailVerified: true // Assume admin emails are pre-verified
      }
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    };

    return {
      success: true,
      user: authUser,
      message: 'Admin user created successfully'
    };
  } catch (error) {
    console.error('Admin creation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create admin user'
    };
  }
}

// Logout and invalidate session
export async function logout(
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> {
  try {
    // Verify token to get user info
    const userInfo = verifyToken(token);
    if (!userInfo) {
      return {
        success: false,
        message: 'Invalid token'
      };
    }

    // Invalidate the session
    await prisma.userSession.updateMany({
      where: {
        token,
        userId: userInfo.id
      },
      data: {
        isActive: false
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: userInfo.id,
        action: 'LOGOUT',
        details: {},
        ipAddress,
        userAgent
      }
    });

    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      message: 'Failed to logout'
    };
  }
}
