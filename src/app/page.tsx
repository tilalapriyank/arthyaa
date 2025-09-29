'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-2 sm:p-4 overflow-x-hidden">
      <div className="w-full max-w-xs sm:max-w-4xl lg:max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="flex flex-col lg:flex-row min-h-[450px] sm:min-h-[500px] lg:min-h-[600px] max-h-screen lg:max-h-none overflow-y-auto lg:overflow-y-visible">
            {/* Left Section - Enhanced Blue Gradient Branding */}
            <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden flex-shrink-0">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-600/20"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              
              {/* Enhanced Wavy Separator */}
              <div className="absolute right-0 top-0 bottom-0 w-24 z-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path 
                    d="M0,0 Q20,15 0,30 T0,50 Q20,65 0,80 T0,100 L0,100 L100,100 L100,0 Z" 
                    fill="white" 
                    className="drop-shadow-lg"
                  />
                </svg>
              </div>
              
              <div className="relative z-20 flex flex-col justify-center items-center h-full p-6 sm:p-8 lg:p-10 pr-8 sm:pr-12 lg:pr-16">
                <div className="text-center max-w-xs sm:max-w-sm">
                  <h2 className="text-white/90 text-base sm:text-lg lg:text-xl mb-4 sm:mb-6 font-light tracking-wide">Welcome back to</h2>
                  
                  {/* Enhanced Building Logo with Animation */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-white rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto shadow-2xl transform hover:scale-105 transition-transform duration-300">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
                    Arthyaa
                  </h1>
                  
                  <p className="text-blue-100 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-sm">
                    Access your society dashboard, manage payments, and stay connected with your community.
                    <span className="block mt-2 font-medium">Secure, fast, and reliable.</span>
                  </p>

                  {/* Enhanced Features List */}
                  <div className="space-y-3 text-left">
                    <div className="flex items-center text-blue-100 text-sm sm:text-base group">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3 group-hover:bg-white/30 transition-colors">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="font-medium">Quick & Secure Login</span>
                    </div>
                    <div className="flex items-center text-blue-100 text-sm sm:text-base group">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3 group-hover:bg-white/30 transition-colors">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <span className="font-medium">OTP Verification</span>
                    </div>
                    <div className="flex items-center text-blue-100 text-sm sm:text-base group">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3 group-hover:bg-white/30 transition-colors">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="font-medium">Mobile-First Design</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 sm:mt-10">
                  <Link 
                    href="/admin/login" 
                    className="inline-flex items-center text-white/80 hover:text-white transition-all duration-300 text-sm sm:text-base group"
                  >
                    <span className="mr-2">Admin Portal</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Section - Enhanced Login Form */}
            <div className="lg:w-1/2 p-6 sm:p-8 lg:p-10 flex flex-col justify-center flex-shrink-0 bg-gradient-to-br from-white to-gray-50">
              <div className="max-w-xs sm:max-w-sm lg:max-w-md mx-auto w-full">
                <div className="mb-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    {step === 'phone' ? 'Member Login' : 'Verify OTP'}
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    {step === 'phone'
                      ? 'Enter your registered phone number to continue'
                      : `We sent a verification code to ${phoneNumber}`
                    }
                  </p>
                </div>

                {/* Phone Number Step */}
                {step === 'phone' && (
                  <form className="space-y-6" onSubmit={handlePhoneSubmit}>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-3">
                        Phone Number
                      </label>
                      <div className="relative group">
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
                          className="block w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 text-gray-900 placeholder-gray-400 bg-white text-base font-medium transition-all duration-200 group-hover:border-gray-300"
                          placeholder="Enter your phone number"
                          aria-label="Phone number"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <svg className="w-6 h-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        We&apos;ll send you a verification code via SMS
                      </p>
                    </div>

                    {success && (
                      <div className="bg-green-50 border-2 border-green-200 text-green-800 px-4 py-4 rounded-xl text-sm animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{success}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-4 rounded-xl text-sm animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending OTP...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>Send OTP</span>
                          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </div>
                      )}
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
                      <div className="relative group">
                        <input
                          id="otp"
                          name="otp"
                          type="text"
                          required
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="block w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 text-gray-900 placeholder-gray-400 bg-white text-center text-2xl tracking-[0.5em] font-mono transition-all duration-200 group-hover:border-gray-300"
                          placeholder="000000"
                          aria-label="OTP verification code"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <svg className="w-6 h-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 text-center flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Enter the 6-digit code sent to your phone
                      </p>
                    </div>

                    {success && (
                      <div className="bg-green-50 border-2 border-green-200 text-green-800 px-4 py-4 rounded-xl text-sm animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{success}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-4 rounded-xl text-sm animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Resend OTP Section */}
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
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
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Verifying...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <span>Verify & Login</span>
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleBackToPhone}
                        className="w-full border-2 border-gray-200 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-200 text-base"
                      >
                        <div className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Change Phone Number
                        </div>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}