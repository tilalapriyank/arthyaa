'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sendOTP, verifyOTP, initializeRecaptcha, clearRecaptcha } from '@/lib/firebase';
import type { ConfirmationResult } from 'firebase/auth';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'member' | 'admin'>('member');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Arthyaa
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose your login method
          </p>
        </div>

        {/* Login Type Selector */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setLoginType('member')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginType === 'member'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Member Login
          </button>
          <button
            onClick={() => setLoginType('admin')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginType === 'admin'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Admin/Staff Login
          </button>
        </div>

        {/* Member Login Form */}
        {loginType === 'member' && <MemberLoginForm />}

        {/* Admin/Staff Login Form */}
        {loginType === 'admin' && <AdminLoginForm />}

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Member Login Component with Firebase OTP
function MemberLoginForm() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    initializeRecaptcha();
    
    return () => {
      // Clean up reCAPTCHA when component unmounts
      clearRecaptcha();
    };
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // First, register the phone number in our database
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'otp-request',
          phone: phoneNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Now send OTP using Firebase
        const firebaseResult = await sendOTP(phoneNumber);
        
        if (firebaseResult.success && firebaseResult.confirmationResult) {
          setConfirmationResult(firebaseResult.confirmationResult);
          setStep('otp');
        } else {
          setError(firebaseResult.message || 'Failed to send OTP');
        }
      } else {
        setError(data.message || 'Failed to register phone number');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (!confirmationResult) {
        setError('No confirmation result found. Please try again.');
        return;
      }

      // Verify OTP using Firebase
      const firebaseResult = await verifyOTP(confirmationResult, otp);
      
      if (firebaseResult.success && firebaseResult.user) {
        // Now verify with our backend
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'otp-verify',
            phone: phoneNumber,
            firebaseUid: (firebaseResult.user as { uid: string }).uid,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Redirect to member dashboard
          window.location.href = '/member/dashboard';
        } else {
          setError(data.message || 'Authentication failed');
        }
      } else {
        setError(firebaseResult.message || 'Invalid OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <form onSubmit={handleSendOTP} className="mt-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Mobile Number
          </label>
          <div className="mt-1">
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter your mobile number"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </div>
        
        {/* reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOTP} className="mt-8 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
          Enter OTP
        </label>
        <div className="mt-1">
          <input
            id="otp"
            name="otp"
            type="text"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Enter 6-digit OTP"
            maxLength={6}
          />
        </div>
        <p className="mt-2 text-sm text-gray-600">
          OTP sent to {phoneNumber}
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => setStep('phone')}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Change Number
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </div>
    </form>
  );
}

// Admin/Staff Login Component with Email/Password
function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'SOCIETY_ADMIN'>('ADMIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'email',
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect based on role
        const redirectPath = role === 'ADMIN' ? '/admin/dashboard' : 
                           '/society-admin/dashboard';
        window.location.href = redirectPath;
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'ADMIN' | 'SOCIETY_ADMIN')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="ADMIN">Admin (Developer)</option>
          <option value="SOCIETY_ADMIN">Society Admin</option>
        </select>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Enter your email"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Enter your password"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <div className="text-center">
        <a href="#" className="text-sm text-indigo-600 hover:text-indigo-500">
          Forgot your password?
        </a>
      </div>
    </form>
  );
}
