'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import ImageUpload from '@/components/ImageUpload';

interface User {
  id: string;
  email?: string;
  phone?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isSecretary?: boolean;
  societyId?: string;
  blockNumber?: string;
  flatNumber?: string;
}

export default function AddReceiptPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    blockNumber: '',
    flatNumber: '',
    amount: '',
    paymentDate: '',
    purpose: '',
    paymentMethod: 'CASH',
    transactionId: '',
    upiId: '',
    document: null as File | null
  });

  // Approval result state
  const [approvalResult, setApprovalResult] = useState<any>(null);
  const [showApprovalResult, setShowApprovalResult] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.user.role === 'MEMBER') {
        setUser(data.user);
        setFormData(prev => ({
          ...prev,
          blockNumber: data.user.blockNumber || '',
          flatNumber: data.user.flatNumber || ''
        }));
      } else {
        router.push('/');
      }
    } catch {
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({
      ...prev,
      document: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('blockNumber', formData.blockNumber);
      formDataToSend.append('flatNumber', formData.flatNumber);
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('paymentDate', formData.paymentDate);
      formDataToSend.append('purpose', formData.purpose);
      formDataToSend.append('paymentMethod', formData.paymentMethod);
      formDataToSend.append('transactionId', formData.transactionId);
      formDataToSend.append('upiId', formData.upiId);
      
      if (formData.document) {
        formDataToSend.append('document', formData.document);
      }

      const response = await fetch('/api/member/receipts', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        setApprovalResult({
          approved: data.approved,
          message: data.message,
          ocrMatchScore: data.ocrMatchScore,
          generatedReceiptUrl: data.receipt?.generatedReceiptUrl
        });
        setShowApprovalResult(true);
        
        if (data.approved) {
          // Reset form after successful submission
          setFormData({
            blockNumber: user?.blockNumber || '',
            flatNumber: user?.flatNumber || '',
            amount: '',
            paymentDate: '',
            purpose: '',
            paymentMethod: 'CASH',
            transactionId: '',
            upiId: '',
            document: null
          });
        }
      } else {
        alert(data.message || 'Error creating receipt');
      }
    } catch (error) {
      console.error('Error creating receipt:', error);
      alert('Error creating receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovalResultClose = () => {
    setShowApprovalResult(false);
    setApprovalResult(null);
    if (approvalResult?.approved) {
      router.push('/member/receipts');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => router.push('/member/receipts')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Receipts
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add New Receipt</h1>
          <p className="text-gray-600">Upload your payment receipt for verification</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Block Number *</label>
                  <input
                    type="text"
                    name="blockNumber"
                    value={formData.blockNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Enter block number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flat Number *</label>
                  <input
                    type="text"
                    name="flatNumber"
                    value={formData.flatNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Enter flat number"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* Purpose and Payment Method */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                  <select
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Select Purpose</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Water Bill">Water Bill</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Parking">Parking</option>
                    <option value="Security">Security</option>
                    <option value="Garbage">Garbage</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            {formData.paymentMethod === 'BANK_TRANSFER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                <input
                  type="text"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Enter transaction ID"
                />
              </div>
            )}

            {formData.paymentMethod === 'UPI' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Enter UPI ID"
                />
              </div>
            )}

            {/* Document Upload */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Receipt Document</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Receipt *</label>
                <ImageUpload
                  onFileSelect={handleFileChange}
                  accept="image/*,.pdf"
                  maxSize={5 * 1024 * 1024} // 5MB
                />
                <p className="text-sm text-gray-500 mt-2">
                  Supported formats: JPG, PNG, PDF. Maximum size: 5MB
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/member/receipts')}
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.document}
                className="px-6 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Upload Receipt'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Approval Result Modal */}
      {showApprovalResult && approvalResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Receipt Status</h2>
                <button
                  onClick={handleApprovalResultClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="text-center">
                {approvalResult.approved ? (
                  <div>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Receipt Approved!</h3>
                    <p className="text-gray-600 mb-4">{approvalResult.message}</p>
                    {approvalResult.ocrMatchScore && (
                      <p className="text-sm text-gray-500">
                        OCR Match Score: {(approvalResult.ocrMatchScore * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Receipt Rejected</h3>
                    <p className="text-gray-600 mb-4">{approvalResult.message}</p>
                    {approvalResult.ocrMatchScore && (
                      <p className="text-sm text-gray-500">
                        OCR Match Score: {(approvalResult.ocrMatchScore * 100).toFixed(1)}% (Required: 85%+)
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleApprovalResultClose}
                  className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
                >
                  {approvalResult.approved ? 'View Receipts' : 'Try Again'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
