'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface User {
  id: string;
  email?: string;
  phone?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isSecretary?: boolean;
}

interface Due {
  id: string;
  memberName: string;
  memberEmail: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  lastReminder?: string;
}

export default function DuesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [societyId, setSocietyId] = useState<string | null>(null);
  const [dues, setDues] = useState<Due[]>([]);
  const [filteredDues, setFilteredDues] = useState<Due[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && (data.user.role === 'SOCIETY_ADMIN' || data.user.role === 'ADMIN')) {
        setUser(data.user);
        setSocietyId(id);
      } else {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, id]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchDues();
    }
  }, [user]);

  const fetchDues = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockDues: Due[] = [
        {
          id: '1',
          memberName: 'John Doe',
          memberEmail: 'john.doe@example.com',
          amount: 500,
          dueDate: '2024-01-01',
          status: 'paid',
          lastReminder: '2024-01-15'
        },
        {
          id: '2',
          memberName: 'Jane Smith',
          memberEmail: 'jane.smith@example.com',
          amount: 500,
          dueDate: '2024-01-01',
          status: 'pending',
          lastReminder: '2024-01-20'
        },
        {
          id: '3',
          memberName: 'Mike Johnson',
          memberEmail: 'mike.johnson@example.com',
          amount: 500,
          dueDate: '2023-12-01',
          status: 'overdue',
          lastReminder: '2024-01-10'
        },
        {
          id: '4',
          memberName: 'Sarah Wilson',
          memberEmail: 'sarah.wilson@example.com',
          amount: 500,
          dueDate: '2024-01-01',
          status: 'paid',
          lastReminder: '2024-01-05'
        }
      ];
      setDues(mockDues);
    } catch (error) {
      console.error('Error fetching dues:', error);
    }
  };

  const filterDues = useCallback(() => {
    let filtered = [...dues];

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(due => due.status === filterStatus);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(due =>
        due.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        due.memberEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDues(filtered);
  }, [dues, searchTerm, filterStatus]);

  useEffect(() => {
    filterDues();
  }, [filterDues]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return '✓';
      case 'pending': return '⏳';
      case 'overdue': return '⚠';
      default: return '?';
    }
  };

  const sendReminder = (due: Due) => {
    // Implement send reminder functionality
    console.log('Sending reminder to:', due.memberEmail);
    alert(`Reminder sent to ${due.memberName}`);
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
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dues Collection</h1>
        <p className="text-gray-600">Manage member dues and track payments</p>
        <p className="text-sm text-gray-500">Society ID: {societyId}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Dues</p>
              <p className="text-2xl font-bold text-gray-900">₹2,000</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Collected</p>
              <p className="text-2xl font-bold text-green-600">₹1,000</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-orange-600">₹1,000</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <input
                type="text"
                placeholder="Search members by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex border border-gray-200 rounded-lg">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-2 text-sm rounded-l-lg transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-violet-50 border border-violet-200 text-violet-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterStatus('paid')}
              className={`px-3 py-2 text-sm transition-colors ${
                filterStatus === 'paid' 
                  ? 'bg-violet-50 border border-violet-200 text-violet-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Paid
            </button>
            <button 
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-2 text-sm transition-colors ${
                filterStatus === 'pending' 
                  ? 'bg-violet-50 border border-violet-200 text-violet-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilterStatus('overdue')}
              className={`px-3 py-2 text-sm rounded-r-lg transition-colors ${
                filterStatus === 'overdue' 
                  ? 'bg-violet-50 border border-violet-200 text-violet-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Overdue
            </button>
          </div>
        </div>
      </div>

      {/* Dues List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-8">
          {filteredDues.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No dues found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDues.map((due) => (
                <div key={due.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-blue-600">
                          {due.memberName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{due.memberName}</h4>
                        <p className="text-sm text-gray-600">{due.memberEmail}</p>
                        <p className="text-xs text-gray-500">Due Date: {new Date(due.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">₹{due.amount}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(due.status)}`}>
                          <span className="mr-1">{getStatusIcon(due.status)}</span>
                          {due.status}
                        </span>
                      </div>
                      {due.status !== 'paid' && (
                        <button
                          onClick={() => sendReminder(due)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Send Reminder
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
