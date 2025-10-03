'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendOTP, verifyOTP, initializeRecaptcha, clearRecaptcha } from '@/lib/firebase';
import type { ConfirmationResult } from 'firebase/auth';

export default function MemberLoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    initializeRecaptcha();

    // Cleanup on unmount
    return () => {
      clearRecaptcha();
    };
  }, []);

  // OTP Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // First check if phone number exists in our database
      const checkResponse = await fetch('/api/auth/member/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
        }),
      });

      const checkResult = await checkResponse.json();

      if (!checkResult.success) {
        setError(checkResult.message || 'Phone number not registered. Please contact your society admin.');
        setIsLoading(false);
        return;
      }

      // Send OTP using Firebase
      const firebaseResult = await sendOTP(phoneNumber);

      if (firebaseResult.success && firebaseResult.confirmationResult) {
        setConfirmationResult(firebaseResult.confirmationResult);
        setStep('otp');
        setError('');
        setSuccess('OTP sent successfully!');
        setOtpTimer(60); // 60 seconds timer
        setCanResend(false);
      } else {
        setError(firebaseResult.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Network error. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (!confirmationResult) {
      setError('Please request OTP again');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Verify OTP using Firebase
      const firebaseResult = await verifyOTP(confirmationResult, otp);

      if (firebaseResult.success && firebaseResult.user) {
        // Now verify with our backend
        const response = await fetch('/api/auth/member/login', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: phoneNumber,
            firebaseUid: (firebaseResult.user as { uid: string }).uid,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Redirect to member dashboard
          router.push(data.redirectUrl || '/member/dashboard');
        } else {
          setError(data.message || 'Login failed');
        }
      } else {
        setError(firebaseResult.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const firebaseResult = await sendOTP(phoneNumber);
      if (firebaseResult.success && firebaseResult.confirmationResult) {
        setConfirmationResult(firebaseResult.confirmationResult);
        setSuccess('New OTP sent successfully!');
        setOtpTimer(60);
        setCanResend(false);
      } else {
        setError(firebaseResult.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setError('');
    setSuccess('');
    setOtpTimer(0);
    setCanResend(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Left Section - Login Form */}
            <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
                      <p className="text-gray-600 text-lg">Log in to Arthyaa</p>
                    </div>
                  </div>
                </div>


                {/* Phone Number Step */}
                {step === 'phone' && (
                  <form className="space-y-6" onSubmit={handlePhoneSubmit}>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-3">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm font-medium">+91</span>
                        </div>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 10) {
                              setPhoneNumber(value);
                            }
                          }}
                          className="flex h-10 rounded-md border border-input bg-background pl-12 pr-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full"
                          placeholder="Enter your phone number"
                          aria-label="Phone number"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        We&apos;ll send you a verification code via SMS
                      </p>
                    </div>

                    {success && (
                      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {success}
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {error}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full"
                    >
                      {isLoading ? 'Sending OTP...' : 'Send OTP'}
                    </button>

                    {/* reCAPTCHA container */}
                    <div id="recaptcha-container"></div>
                  </form>
                )}

                {/* OTP Verification Step */}
                {step === 'otp' && (
                  <form className="space-y-6" onSubmit={handleOtpSubmit}>
                    <div>
                      <label htmlFor="otp" className="block text-sm font-semibold text-gray-900 mb-3">
                        Enter Verification Code
                      </label>
                      <div className="relative">
                        <input
                          id="otp"
                          name="otp"
                          type="text"
                          required
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="flex h-10 rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full text-center text-2xl tracking-widest font-mono"
                          placeholder="000000"
                          aria-label="OTP verification code"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        Enter the 6-digit code sent to your phone
                      </p>
                    </div>

                    {success && (
                      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {success}
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {error}
                        </div>
                      </div>
                    )}

                    {/* Resend OTP Section */}
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      {otpTimer > 0 ? (
                        <div className="flex items-center justify-center text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium">Resend OTP in {otpTimer} seconds</span>
                        </div>
                      ) : canResend ? (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isLoading}
                          className="text-sm text-blue-600 hover:text-blue-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center mx-auto"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Resend OTP
                        </button>
                      ) : (
                        <p className="text-sm text-gray-500 flex items-center justify-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Didn&apos;t receive OTP? Check your SMS or try resending
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full"
                      >
                        {isLoading ? 'Verifying...' : 'Verify & Login'}
                      </button>

                      <button
                        type="button"
                        onClick={handleBackToPhone}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 h-10 px-4 py-2 w-full"
                      >
                        Change Phone Number
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Right Section - Testimonial/Marketing */}
            <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-indigo-600/30"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
              <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full -translate-x-12 -translate-y-12"></div>
              
              <div className="relative z-10">
                {/* Feature Tags */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="px-4 py-2 bg-white/20 text-white text-sm rounded-full border border-white/30 backdrop-blur-sm">
                    📱 Easy OTP Login
                  </span>
                  <span className="px-4 py-2 bg-white/20 text-white text-sm rounded-full border border-white/30 backdrop-blur-sm">
                    🏘️ Society Management
                  </span>
                </div>

                {/* Main Content */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Connect with Your Society
                  </h2>
                  <p className="text-blue-100 text-lg leading-relaxed mb-6">
                    Access your society&apos;s services, stay updated with announcements, and manage your membership with ease.
                  </p>
                </div>

                {/* Testimonial */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold">Rajesh Kumar</p>
                      <p className="text-blue-100 text-sm">Society Secretary</p>
                    </div>
                  </div>
                  <p className="text-white text-lg leading-relaxed">
                    &ldquo;I was able to streamline my society management by 40% using Arthyaa&apos;s comprehensive platform.&rdquo;
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-2xl font-bold text-white">10K+</div>
                    <div className="text-blue-100 text-sm">Active Members</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-2xl font-bold text-white">500+</div>
                    <div className="text-blue-100 text-sm">Societies</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}