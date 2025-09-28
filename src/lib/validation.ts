import { z } from 'zod';

// Phone number validation
export const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must not exceed 15 digits')
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .transform((phone) => {
    // Ensure phone has country code
    return phone.startsWith('+') ? phone : `+91${phone}`;
  });

// Email validation
export const emailSchema = z.string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase();

// Password validation with strong policy
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/^(?=.*\d)/, 'Password must contain at least one number')
  .regex(/^(?=.*[@$!%*?&])/, 'Password must contain at least one special character (@$!%*?&)');

// Name validation
export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// OTP validation
export const otpSchema = z.string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only numbers');

// User role validation
export const userRoleSchema = z.enum(['ADMIN', 'SOCIETY_ADMIN', 'MEMBER']);

// Login validation schemas
export const memberLoginSchema = z.object({
  type: z.literal('otp-request'),
  phone: phoneSchema,
});

export const memberOtpVerifySchema = z.object({
  type: z.literal('otp-verify'),
  phone: phoneSchema,
  firebaseUid: z.string().min(1, 'Firebase UID is required'),
});

export const adminLoginSchema = z.object({
  type: z.literal('email'),
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  role: userRoleSchema.refine(role => role !== 'MEMBER', 'Invalid role for admin login'),
});

// Simple admin login schema (email + password only, role auto-detected)
export const simpleAdminLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Password reset schemas
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User registration schema
export const userRegistrationSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  password: passwordSchema.optional(),
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  role: userRoleSchema,
}).refine(data => {
  // Members must have phone, Admins must have email and password
  if (data.role === 'MEMBER') {
    return !!data.phone;
  } else {
    return !!data.email && !!data.password;
  }
}, {
  message: "Members must provide phone number, Admins must provide email and password",
});

// Helper function to validate and sanitize input
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((err) => err.message);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw new Error('Invalid input data');
  }
}

// Phone number utilities
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Add +91 if no country code
  if (!cleaned.startsWith('+')) {
    return `+91${cleaned}`;
  }

  return cleaned;
}

export function isValidIndianPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Indian mobile numbers: +91 followed by 10 digits starting with 6-9
  return /^\+91[6-9]\d{9}$/.test(normalized);
}

// Email utilities
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// Security utilities
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function isPasswordStrong(password: string): boolean {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
}