'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  member: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  ocrData?: Record<string, unknown>;
  ocrConfidence?: number;
  ocrMatchScore?: number;
}


export default function SocietyReceiptsPage({ params }: { params: { id: string } }) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const fetchReceipts = useCallback(async () => {
    try {
      const response = await fetch(`/api/society-admin/receipts?societyId=${params.id}`);
      const data = await response.json();
      if (data.success) {
        setReceipts(data.receipts);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    }
  }, [params.id]);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && (data.user.role === 'SOCIETY_ADMIN' || data.user.role === 'ADMIN')) {
        fetchReceipts();
      } else {
        router.push('/');
      }
    } catch {
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [fetchReceipts, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);


  const handleDownloadReceipt = async (receiptId: string) => {
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

  const filteredReceipts = receipts.filter(receipt => {
    const matchesStatus = filterStatus === 'ALL' || receipt.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      receipt.blockNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.member.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading receipts..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Receipts</h1>
          <p className="text-gray-600">Manage and approve member receipts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by block, flat, member name, or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Receipts List */}
      <div className="bg-white rounded-lg shadow">
        {filteredReceipts.length === 0 ? (
          <div className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts found</h3>
            <p className="text-gray-500">No receipts match your current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {receipt.member.firstName} {receipt.member.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{receipt.member.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Block {receipt.blockNumber}, Flat {receipt.flatNumber}
                        </div>
                        <div className="text-sm text-gray-500">{receipt.purpose}</div>
                        {receipt.ocrConfidence && (
                          <div className="text-xs text-blue-600">
                            OCR Confidence: {(receipt.ocrConfidence * 100).toFixed(1)}%
                          </div>
                        )}
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
                        <a
                          href={receipt.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-600 hover:text-violet-900"
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
