'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Receipt {
  id: string;
  blockNumber: string;
  flatNumber: string;
  amount: number;
  paymentDate: string;
  purpose: string;
  paymentMethod: string;
  transactionId?: string;
  upiId?: string;
  documentUrl: string;
  documentName: string;
  status: string;
  createdAt: string;
  ocrData?: any;
  ocrConfidence?: number;
  ocrMatchScore?: number;
  generatedReceiptUrl?: string;
}

interface User {
  id: string;
  email?: string;
  phone?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isSecretary?: boolean;
  societyId?: string;
}

export default function ReceiptDetailPage() {
  const [user, setUser] = useState<User | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const receiptId = params.id as string;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.user.role === 'MEMBER') {
        setUser(data.user);
        fetchReceipt();
      } else {
        router.push('/');
      }
    } catch {
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReceipt = async () => {
    try {
      const response = await fetch(`/api/member/receipts/${receiptId}`);
      const data = await response.json();
      if (data.success) {
        setReceipt(data.receipt);
      } else {
        router.push('/member/receipts');
      }
    } catch (error) {
      console.error('Error fetching receipt:', error);
      router.push('/member/receipts');
    }
  };

  const handleDeleteReceipt = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/member/receipts/${receiptId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        router.push('/member/receipts');
      } else {
        alert(data.message || 'Error deleting receipt');
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Error deleting receipt');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const response = await fetch(`/api/member/receipts/${receiptId}/download`);
      const data = await response.json();

      if (data.success) {
        window.open(data.receiptUrl, '_blank');
      } else {
        alert(data.message || 'Error generating receipt');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Error downloading receipt');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Cash';
      case 'UPI':
        return 'UPI';
      case 'BANK_TRANSFER':
        return 'Bank Transfer';
      case 'CHEQUE':
        return 'Cheque';
      default:
        return method;
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading receipt..." />;
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Receipt Not Found</h1>
          <p className="text-gray-600 mb-4">The receipt you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/member/receipts')}
            className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
          >
            Back to Receipts
          </button>
        </div>
      </div>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Receipt Details</h1>
          <p className="text-gray-600">Receipt ID: #{receipt.id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="flex space-x-3">
          {receipt.status === 'APPROVED' && (
            <button
              onClick={handleDownloadReceipt}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Receipt</span>
            </button>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete Receipt</span>
          </button>
        </div>
      </div>

      {/* Receipt Details Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Status Header */}
        <div className={`px-6 py-4 border-l-4 ${getStatusColor(receipt.status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Receipt Status</h2>
              <p className="text-sm opacity-75">
                {receipt.status === 'APPROVED' ? 'This receipt has been approved' : 'This receipt has been rejected'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(receipt.status)}`}>
              {receipt.status}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-semibold text-lg text-green-600">{formatCurrency(receipt.amount)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Payment Date</span>
                  <span className="font-medium">{formatDate(receipt.paymentDate)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium">{getPaymentMethodDisplay(receipt.paymentMethod)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Purpose</span>
                  <span className="font-medium">{receipt.purpose}</span>
                </div>
                {receipt.transactionId && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-medium font-mono text-sm">{receipt.transactionId}</span>
                  </div>
                )}
                {receipt.upiId && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">UPI ID</span>
                    <span className="font-medium">{receipt.upiId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Property Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Block Number</span>
                  <span className="font-medium">{receipt.blockNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Flat Number</span>
                  <span className="font-medium">{receipt.flatNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Submitted On</span>
                  <span className="font-medium">{formatDate(receipt.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* OCR Information */}
          {receipt.ocrData && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">OCR Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">OCR Confidence</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {receipt.ocrConfidence ? `${(receipt.ocrConfidence * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Match Score</div>
                  <div className="text-2xl font-bold text-green-900">
                    {receipt.ocrMatchScore ? `${(receipt.ocrMatchScore * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 font-medium">Entry Type</div>
                  <div className="text-lg font-bold text-gray-900">
                    {receipt.isManualEntry ? 'Manual Entry' : 'OCR Assisted'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Document</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Document Name</p>
                <p className="font-medium">{receipt.documentName}</p>
              </div>
              <a
                href={receipt.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>View Document</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Receipt</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this receipt? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteReceipt}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Receipt'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
