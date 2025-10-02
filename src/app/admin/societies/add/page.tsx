'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email?: string;
  phone?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isSecretary?: boolean;
}

export default function AddSocietyPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    mobile: '',
    city: '',
    state: '',
    pincode: '',
    blocks: '',
    flats: '',
    adminEmail: ''
  });
  const router = useRouter();

  const handleLogout = async () => {
    try {
      localStorage.removeItem('auth-token');
      setUser(null);
      router.push('/admin/login');
    } catch (error) {
      localStorage.removeItem('auth-token');
      setUser(null);
      router.push('/admin/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      setError('Please fix the errors below before submitting.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/admin/societies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          email: formData.adminEmail,
          mobile: formData.mobile,
          blocks: formData.blocks,
          flats: formData.flats,
          adminEmail: formData.adminEmail
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Society created successfully! Admin invite email sent.');
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Failed to create society');
      }
    } catch (error) {
      console.error('Error creating society:', error);
      setError('Failed to create society. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Society name is required';
        if (value.trim().length < 3) return 'Society name must be at least 3 characters';
        return '';
      case 'mobile':
        if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/\s/g, ''))) return 'Please enter a valid mobile number';
        return '';
      case 'pincode':
        if (value && !/^\d{6}$/.test(value)) return 'Pincode must be 6 digits';
        return '';
      case 'blocks':
        if (value && (isNaN(Number(value)) || Number(value) < 1)) return 'Number of blocks must be a positive number';
        return '';
      case 'flats':
        if (value && (isNaN(Number(value)) || Number(value) < 1)) return 'Number of flats must be a positive number';
        return '';
      case 'adminEmail':
        if (!value.trim()) return 'Admin email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Required fields
    if (!formData.name.trim()) errors.name = 'Society name is required';
    if (!formData.adminEmail.trim()) errors.adminEmail = 'Admin email is required';
    
    // Validate all fields
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) errors[key] = error;
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            {/* Left Side - Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Add Society</h1>
              <p className="text-sm text-gray-600">Create a new society management system</p>
            </div>
          </div>
          
          {/* Right Side - User Profile and Logout */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200/50 shadow-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-semibold text-lg">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="text-sm">
                <div className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</div>
                <div className="text-gray-600 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium">System Administrator</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {user?.email}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-red-300 bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full py-4 px-4">
        <div className="w-full">
          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create New Society</h2>
            <p className="text-gray-600">Fill in the details below to create a new society</p>
          </div>

          {/* Form Content */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1: Society Name and Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Society Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full ${
                        formErrors.name 
                          ? 'border-red-300' 
                          : ''
                      }`}
                      placeholder="Enter society name"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      id="mobile"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full ${
                        formErrors.mobile 
                          ? 'border-red-300' 
                          : ''
                      }`}
                      placeholder="+91 9876543210"
                    />
                    {formErrors.mobile && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.mobile}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Address (full width) */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Enter complete society address"
                  />
                </div>

                {/* Row 3: Location Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full ${
                        formErrors.city 
                          ? 'border-red-300' 
                          : ''
                      }`}
                      placeholder="Enter city name"
                    />
                    {formErrors.city && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full ${
                        formErrors.state 
                          ? 'border-red-300' 
                          : 'border-gray-300'
                      }`}
                      placeholder="Enter state name"
                    />
                    {formErrors.state && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.state}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full ${
                        formErrors.pincode 
                          ? 'border-red-300' 
                          : 'border-gray-300'
                      }`}
                      placeholder="Enter 6-digit pincode"
                    />
                    {formErrors.pincode && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.pincode}</p>
                    )}
                  </div>
                </div>

                {/* Row 4: Structure Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="blocks" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Blocks
                    </label>
                    <input
                      type="number"
                      id="blocks"
                      name="blocks"
                      value={formData.blocks}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full ${
                        formErrors.blocks 
                          ? 'border-red-300' 
                          : 'border-gray-300'
                      }`}
                      placeholder="e.g., 5"
                    />
                    {formErrors.blocks && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.blocks}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="flats" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Flats
                    </label>
                    <input
                      type="number"
                      id="flats"
                      name="flats"
                      value={formData.flats}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full ${
                        formErrors.flats 
                          ? 'border-red-300' 
                          : 'border-gray-300'
                      }`}
                      placeholder="e.g., 200"
                    />
                    {formErrors.flats && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.flats}</p>
                    )}
                  </div>
                </div>

                {/* Row 5: Admin Email (full width) */}
                <div>
                  <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Society Admin Email *
                  </label>
                  <input
                    type="email"
                    id="adminEmail"
                    name="adminEmail"
                    required
                    value={formData.adminEmail}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full ${
                      formErrors.adminEmail 
                        ? 'border-red-300' 
                        : 'border-gray-300'
                    }`}
                    placeholder="admin@example.com"
                  />
                  {formErrors.adminEmail && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.adminEmail}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    This email will be used for both society contact and admin account setup.
                  </p>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{success}</span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/dashboard')}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 h-10 px-4 py-2"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
                  >
                    {isLoading ? 'Creating Society...' : 'Create Society'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
