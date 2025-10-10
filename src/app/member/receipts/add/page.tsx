'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

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

interface Block {
  id: string;
  name: string;
}

interface Flat {
  id: string;
  name: string;
  floorNumber: number;
}

export default function AddReceiptPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingFlats, setLoadingFlats] = useState(false);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    blockId: '',
    flatId: '',
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

  useEffect(() => {
    if (user?.societyId) {
      fetchBlocks();
    }
  }, [user?.societyId]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.user.role === 'MEMBER') {
        setUser(data.user);
      } else {
        router.push('/');
      }
    } catch {
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlocks = async () => {
    setLoadingBlocks(true);
    try {
      const response = await fetch(`/api/member/blocks?societyId=${user?.societyId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setBlocks(data.blocks);
      } else {
        console.error('Error fetching blocks:', data.message);
        setBlocks([]);
      }
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const fetchFlats = async (blockId: string) => {
    setLoadingFlats(true);
    try {
      const response = await fetch(`/api/member/flats?blockId=${blockId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setFlats(data.flats);
      } else {
        console.error('Error fetching flats:', data.message);
        setFlats([]);
      }
    } catch (error) {
      console.error('Error fetching flats:', error);
      setFlats([]);
    } finally {
      setLoadingFlats(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // If block is changed, reset flat selection and fetch flats
    if (name === 'blockId') {
      setFormData(prev => ({
        ...prev,
        blockId: value,
        flatId: '', // Reset flat selection when block changes
        blockNumber: blocks.find(b => b.id === value)?.name || '',
        flatNumber: '' // Reset flat number
      }));
      
      if (value) {
        fetchFlats(value);
      } else {
        setFlats([]);
      }
    } else if (name === 'flatId') {
      setFormData(prev => ({
        ...prev,
        flatId: value,
        flatNumber: flats.find(f => f.id === value)?.name || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
            blockId: '',
            flatId: '',
            blockNumber: '',
            flatNumber: '',
            amount: '',
            paymentDate: '',
            purpose: '',
            paymentMethod: 'CASH',
            transactionId: '',
            upiId: '',
            document: null
          });
          setFlats([]);
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Block *</label>
                  <select
                    name="blockId"
                    value={formData.blockId}
                    onChange={handleInputChange}
                    required
                    disabled={loadingBlocks}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Block</option>
                    {blocks.map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.name}
                      </option>
                    ))}
                  </select>
                  {loadingBlocks && (
                    <p className="text-sm text-gray-500 mt-1">Loading blocks...</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flat *</label>
                  <select
                    name="flatId"
                    value={formData.flatId}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.blockId || loadingFlats}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Flat</option>
                    {flats.map((flat) => (
                      <option key={flat.id} value={flat.id}>
                        {flat.name} (Floor {flat.floorNumber})
                      </option>
                    ))}
                  </select>
                  {loadingFlats && (
                    <p className="text-sm text-gray-500 mt-1">Loading flats...</p>
                  )}
                  {!formData.blockId && (
                    <p className="text-sm text-gray-500 mt-1">Please select a block first</p>
                  )}
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
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="document" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> receipt document
                        </p>
                        <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 5MB)</p>
                      </div>
                      <input 
                        id="document" 
                        type="file" 
                        name="document"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                        className="hidden"
                        required
                      />
                    </label>
                  </div>
                  
                  {formData.document && (
                    <div className="flex items-center space-x-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800">
                          {formData.document.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {(formData.document.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileChange(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
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
