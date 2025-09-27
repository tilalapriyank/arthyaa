import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth } from './firebase-config';

// Initialize reCAPTCHA verifier
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const initializeRecaptcha = (containerId: string = 'recaptcha-container') => {
  if (typeof window !== 'undefined' && !recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
  }
  return recaptchaVerifier;
};

export const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; message: string; confirmationResult?: ConfirmationResult }> => {
  try {
    if (typeof window === 'undefined') {
      return { success: false, message: 'Firebase auth can only be used on client side' };
    }

    // Ensure phone number has country code
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    // Initialize reCAPTCHA if not already done
    if (!recaptchaVerifier) {
      initializeRecaptcha();
    }

    if (!recaptchaVerifier) {
      return { success: false, message: 'reCAPTCHA not initialized' };
    }

    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    
    return {
      success: true,
      message: 'OTP sent successfully',
      confirmationResult
    };
  } catch (error: unknown) {
    console.error('Firebase OTP error:', error);
    return {
      success: false,
      message: (error as Error).message || 'Failed to send OTP'
    };
  };
};

export const verifyOTP = async (confirmationResult: ConfirmationResult, otpCode: string): Promise<{ success: boolean; message: string; user?: unknown }> => {
  try {
    if (typeof window === 'undefined') {
      return { success: false, message: 'Firebase auth can only be used on client side' };
    }

    const result = await confirmationResult.confirm(otpCode);
    const user = result.user;
    
    return {
      success: true,
      message: 'OTP verified successfully',
      user
    };
  } catch (error: unknown) {
    console.error('Firebase OTP verification error:', error);
    return {
      success: false,
      message: (error as Error).message || 'Invalid OTP'
    };
  };
};

export const clearRecaptcha = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
};
