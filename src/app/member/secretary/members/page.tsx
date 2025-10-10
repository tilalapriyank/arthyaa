'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  memberType: string;
  flatNumber: string;
  blockNumber: string;
  isSecretary: boolean;
  createdAt: string;
  lastLoginAt?: string;
  agreementDocumentStatus?: string;
  policyVerificationDocumentStatus?: string;
  policyVerificationDeadline?: string;
}


export default function SecretaryMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [memberTypeFilter, setMemberTypeFilter] = useState('all');
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

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.user.role === 'MEMBER' && data.user.isSecretary) {
        fetchMembers();
      } else {
        router.push('/member/dashboard');
      }
    } catch {
      router.push('/member/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const response = await fetch('/api/member/secretary/members', {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setMembers(data.members);
      } else {
        console.error('Failed to fetch members:', data.message);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

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
      const response = await fetch(`/api/member/secretary/members/${deleteDialog.member.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Remove the member from the list
        setMembers(prev => prev.filter(member => member.id !== deleteDialog.member!.id));
        setDeleteDialog({ isOpen: false, member: null, isLoading: false });
      } else {
        alert('Failed to delete member: ' + data.message);
        setDeleteDialog(prev => ({ ...prev, isLoading: false }));
      }
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

  // Filter members based on search and filters
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || member.status.toLowerCase() === statusFilter;
    const matchesType = memberTypeFilter === 'all' || member.memberType.toLowerCase() === memberTypeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading members..." />;
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Society Members</h1>
          <p className="text-gray-600 mt-1">Manage all members in your society</p>
        </div>
        <Link
          href="/member/secretary/members/add"
          className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-violet-600 text-white hover:bg-violet-700 h-10 px-4 py-2"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Member
        </Link>
      </div>

      {/* Search and Controls */}
      <div className="space-y-4 mb-6">
        {/* Search Bar and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search members by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            
            <select
              value={memberTypeFilter}
              onChange={(e) => setMemberTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="owner">Owner</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoadingMembers ? (
          <div className="text-center py-12">
            <LoadingSpinner text="Loading members..." />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new member.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flat Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-violet-600">
                              {member.firstName[0]}{member.lastName[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                            {member.isSecretary && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Secretary
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Joined {new Date(member.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email}</div>
                      <div className="text-sm text-gray-500">{member.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Flat {member.flatNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        Block {member.blockNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : member.status === 'INACTIVE'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.memberType === 'OWNER' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.memberType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/member/secretary/members/${member.id}`}
                          className="text-violet-600 hover:text-violet-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/member/secretary/members/${member.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                        {!member.isSecretary && (
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteMember}
        title="Delete Member"
        message={`Are you sure you want to delete ${deleteDialog.member?.firstName} ${deleteDialog.member?.lastName}? This action cannot be undone.`}
        isLoading={deleteDialog.isLoading}
      />
    </div>
  );
}
