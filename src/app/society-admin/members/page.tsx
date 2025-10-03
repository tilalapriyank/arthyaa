'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';

interface User {
  id: string;
  email?: string;
  phone?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isSecretary?: boolean;
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  joinedAt: string;
  duesStatus: 'paid' | 'pending' | 'overdue';
  lastPaymentDate?: string;
}

export default function MembersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    member: Member | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    member: null,
    isLoading: false
  });
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.user.role === 'SOCIETY_ADMIN') {
        setUser(data.user);
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

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  const fetchMembers = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockMembers: Member[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+91 98765 43210',
          address: '123 Main Street, Mumbai',
          isActive: true,
          joinedAt: '2024-01-15',
          duesStatus: 'paid',
          lastPaymentDate: '2024-01-01'
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+91 98765 43211',
          address: '456 Oak Avenue, Mumbai',
          isActive: true,
          joinedAt: '2024-01-20',
          duesStatus: 'pending',
          lastPaymentDate: '2023-12-01'
        },
        {
          id: '3',
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike.johnson@example.com',
          phone: '+91 98765 43212',
          address: '789 Pine Road, Mumbai',
          isActive: false,
          joinedAt: '2023-12-01',
          duesStatus: 'overdue',
          lastPaymentDate: '2023-11-01'
        },
        {
          id: '4',
          firstName: 'Sarah',
          lastName: 'Wilson',
          email: 'sarah.wilson@example.com',
          phone: '+91 98765 43213',
          address: '321 Elm Street, Mumbai',
          isActive: true,
          joinedAt: '2024-02-01',
          duesStatus: 'paid',
          lastPaymentDate: '2024-02-01'
        }
      ];
      setMembers(mockMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const filterMembers = useCallback(() => {
    let filtered = [...members];

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(member => 
        filterStatus === 'active' ? member.isActive : !member.isActive
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMembers(filtered);
  }, [members, searchTerm, filterStatus]);

  useEffect(() => {
    filterMembers();
  }, [filterMembers]);

  const handleDeleteMember = (member: Member) => {
    setDeleteDialog({
      isOpen: true,
      member,
      isLoading: false
    });
  };

  const confirmDeleteMember = async () => {
    if (!deleteDialog.member) return;

    setDeleteDialog(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMembers(members.filter(member => member.id !== deleteDialog.member!.id));
      setDeleteDialog({ isOpen: false, member: null, isLoading: false });
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member');
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const closeDeleteDialog = () => {
    if (!deleteDialog.isLoading) {
      setDeleteDialog({ isOpen: false, member: null, isLoading: false });
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Member Management</h1>
          <p className="text-gray-600 mt-1">Manage society members and track their information</p>
        </div>
        <a
          href="/society-admin/members/add"
          className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-violet-600 text-white hover:bg-violet-700 h-10 px-4 py-2"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Member
        </a>
      </div>

      {/* Search and Controls */}
      <div className="space-y-4 mb-6">
        {/* Search Bar and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <input
                type="text"
                placeholder="Search members by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
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
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-2 text-sm transition-colors ${
                filterStatus === 'active' 
                  ? 'bg-violet-50 border border-violet-200 text-violet-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Active
            </button>
            <button 
              onClick={() => setFilterStatus('inactive')}
              className={`px-3 py-2 text-sm rounded-r-lg transition-colors ${
                filterStatus === 'inactive' 
                  ? 'bg-violet-50 border border-violet-200 text-violet-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Layout Toggle */}
          <div className="flex border border-gray-200 rounded-lg">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-l-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-violet-50 border border-violet-200' 
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-r-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-violet-50 border border-violet-200' 
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-8">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {members.length === 0 ? 'No members yet' : 'No members found'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {members.length === 0 
                  ? 'Get started by adding your first member. You can manage all members from this dashboard.'
                  : 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                }
              </p>
              <a
                href="/society-admin/members/add"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Your First Member
              </a>
            </div>
          ) : (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-lg font-semibold text-blue-600">
                              {member.firstName[0]}{member.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {member.firstName} {member.lastName}
                            </h4>
                            <p className="text-sm text-gray-600">{member.email}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          {member.phone && (
                            <p className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {member.phone}
                            </p>
                          )}
                          {member.address && (
                            <p className="flex items-start">
                              <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="line-clamp-2">{member.address}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMember(member)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                        title="Delete member"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.duesStatus)}`}>
                          <span className="mr-1">{getStatusIcon(member.duesStatus)}</span>
                          {member.duesStatus}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          member.isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                        }`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-blue-600">
                            {member.firstName[0]}{member.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {member.firstName} {member.lastName}
                            </h4>
                            <button
                              onClick={() => handleDeleteMember(member)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                              title="Delete member"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {member.email}
                            </div>
                            {member.phone && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {member.phone}
                              </div>
                            )}
                            {member.address && (
                              <div className="flex items-start">
                                <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="line-clamp-1">{member.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 ml-6">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.duesStatus)}`}>
                            <span className="mr-1">{getStatusIcon(member.duesStatus)}</span>
                            {member.duesStatus}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            member.isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                          }`}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteMember}
        title="Delete Member"
        message="Are you sure you want to delete this member? This action cannot be undone."
        itemName={deleteDialog.member ? `${deleteDialog.member.firstName} ${deleteDialog.member.lastName}` : ''}
        isLoading={deleteDialog.isLoading}
      />
    </div>
  );
}
