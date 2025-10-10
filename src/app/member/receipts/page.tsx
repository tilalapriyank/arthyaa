'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import ImageUpload from '@/components/ImageUpload';

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
  blockNumber?: string;
  flatNumber?: string;
}

export default function ReceiptsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
        fetchReceipts();
      } else {
        router.push('/');
      }
    } catch {
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReceipts = async () => {
    try {
      const response = await fetch('/api/member/receipts');
      const data = await response.json();
      if (data.success) {
        setReceipts(data.receipts);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    }
  };


  const handleDownloadReceipt = async (receiptId: string) => {
    try {
      const response = await fetch(`/api/member/receipts/${receiptId}/download`);
      const data = await response.json();

      if (data.success) {
        // Open the receipt URL in a new tab for download
        window.open(data.receiptUrl, '_blank');
      } else {
        alert(data.message || 'Error generating receipt');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Error downloading receipt');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading receipts..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-600">Manage your payment receipts</p>
        </div>
        <button
          onClick={() => router.push('/member/receipts/add')}
          className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Receipt</span>
        </button>
      </div>

      {/* Receipts List */}
      <div className="bg-white rounded-lg shadow">
        {receipts.length === 0 ? (
          <div className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts found</h3>
            <p className="text-gray-500 mb-4">Start by uploading your first receipt</p>
            <button
              onClick={() => router.push('/member/receipts/add')}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
            >
              Add Receipt
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Block {receipt.blockNumber}, Flat {receipt.flatNumber}
                        </div>
                        <div className="text-sm text-gray-500">{receipt.purpose}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(receipt.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {receipt.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(receipt.status)}`}>
                        {receipt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(receipt.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/member/receipts/${receipt.id}`)}
                          className="text-violet-600 hover:text-violet-900"
                        >
                          View Details
                        </button>
                        <a
                          href={receipt.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Document
                        </a>
                        {receipt.status === 'APPROVED' && (
                          <button
                            onClick={() => handleDownloadReceipt(receipt.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Download Receipt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
