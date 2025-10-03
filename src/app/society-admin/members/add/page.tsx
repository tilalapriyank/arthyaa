'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';


export default function AddMemberPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    flatNumber: '',
    blockNumber: '',
    memberType: 'OWNER' as 'OWNER' | 'TENANT',
    isSecretary: false,
    isActive: true,
    duesAmount: '',
    notes: '',
    agreementDocument: null as File | null,
    policyVerificationDocument: null as File | null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.user.role === 'SOCIETY_ADMIN') {
        // User is authenticated
      } else {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.flatNumber.trim()) {
      newErrors.flatNumber = 'Flat number is required';
    }

    if (!formData.blockNumber.trim()) {
      newErrors.blockNumber = 'Block number is required';
    }

    // Validate tenant-specific documents
    if (formData.memberType === 'TENANT') {
      if (!formData.agreementDocument) {
        newErrors.agreementDocument = 'Agreement document is required for tenants';
      }
      if (!formData.policyVerificationDocument) {
        newErrors.policyVerificationDocument = 'Policy verification document is required for tenants';
      }
    }

    if (formData.duesAmount && isNaN(Number(formData.duesAmount))) {
      newErrors.duesAmount = 'Dues amount must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('flatNumber', formData.flatNumber);
      formDataToSend.append('blockNumber', formData.blockNumber);
      formDataToSend.append('memberType', formData.memberType);
      formDataToSend.append('isSecretary', formData.isSecretary.toString());
      formDataToSend.append('isActive', formData.isActive.toString());
      formDataToSend.append('duesAmount', formData.duesAmount);
      formDataToSend.append('notes', formData.notes);

      // Add files if they exist
      if (formData.agreementDocument) {
        formDataToSend.append('agreementDocument', formData.agreementDocument);
      }
      if (formData.policyVerificationDocument) {
        formDataToSend.append('policyVerificationDocument', formData.policyVerificationDocument);
      }

      const response = await fetch('/api/society-admin/members', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        alert('Member added successfully! Welcome email has been sent.');
        // Redirect to members list
        router.push('/society-admin/members');
      } else {
        alert(data.message || 'Failed to add member. Please try again.');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      [fieldName]: file
    }));

    // Clear error when user selects a file
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Member</h1>
          <p className="text-gray-600 mt-1">Add a new member to your society</p>
        </div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-10 px-4 py-2"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                    errors.address ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter full address"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>
            </div>

            {/* Society Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Society Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="flatNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Flat Number *
                  </label>
                  <input
                    type="text"
                    id="flatNumber"
                    name="flatNumber"
                    value={formData.flatNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                      errors.flatNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter flat number"
                  />
                  {errors.flatNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.flatNumber}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="blockNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Block Number *
                  </label>
                  <input
                    type="text"
                    id="blockNumber"
                    name="blockNumber"
                    value={formData.blockNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                      errors.blockNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter block number"
                  />
                  {errors.blockNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.blockNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Membership Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="memberType" className="block text-sm font-medium text-gray-700 mb-2">
                    Member Type *
                  </label>
                  <select
                    id="memberType"
                    name="memberType"
                    value={formData.memberType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="TENANT">Tenant</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="duesAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Dues Amount
                  </label>
                  <input
                    type="number"
                    id="duesAmount"
                    name="duesAmount"
                    value={formData.duesAmount}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                      errors.duesAmount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter monthly dues amount"
                  />
                  {errors.duesAmount && (
                    <p className="mt-1 text-sm text-red-600">{errors.duesAmount}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active member
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isSecretary"
                    name="isSecretary"
                    checked={formData.isSecretary}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isSecretary" className="ml-2 block text-sm text-gray-700">
                    Secretary
                  </label>
                </div>
              </div>
            </div>

            {/* Tenant Documents */}
            {formData.memberType === 'TENANT' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents (Tenant)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="agreementDocument" className="block text-sm font-medium text-gray-700 mb-2">
                      Agreement Document *
                    </label>
                    <input
                      type="file"
                      id="agreementDocument"
                      name="agreementDocument"
                      onChange={(e) => handleFileChange(e, 'agreementDocument')}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                        errors.agreementDocument ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.agreementDocument && (
                      <p className="mt-1 text-sm text-red-600">{errors.agreementDocument}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Accepted formats: PDF, DOC, DOCX, JPG, PNG</p>
                  </div>

                  <div>
                    <label htmlFor="policyVerificationDocument" className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Verification Document *
                    </label>
                    <input
                      type="file"
                      id="policyVerificationDocument"
                      name="policyVerificationDocument"
                      onChange={(e) => handleFileChange(e, 'policyVerificationDocument')}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                        errors.policyVerificationDocument ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.policyVerificationDocument && (
                      <p className="mt-1 text-sm text-red-600">{errors.policyVerificationDocument}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Accepted formats: PDF, DOC, DOCX, JPG, PNG</p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="mt-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Any additional notes about the member"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-10 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-violet-600 text-white hover:bg-violet-700 h-10 px-4 py-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Member...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Member
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
