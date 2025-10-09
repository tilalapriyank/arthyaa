'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import DocumentStatusModal from '@/components/DocumentStatusModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { TableSkeleton } from '@/components/SkeletonLoader';

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
  isActive: boolean;
  joinedAt: string;
  duesStatus: 'paid' | 'pending' | 'overdue';
  lastPaymentDate?: string;
  flatNumber?: string;
  blockNumber?: string;
  memberType: 'OWNER' | 'TENANT';
  isSecretary?: boolean;
  status?: string;
  // Document status fields for tenants
  agreementDocumentStatus?: string;
  policyVerificationDocumentStatus?: string;
  policyVerificationDeadline?: string;
}

export default function MembersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [societyId, setSocietyId] = useState<string | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    member: Member | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    member: null,
    isLoading: false
  });
  const [documentStatusModal, setDocumentStatusModal] = useState<{
    isOpen: boolean;
    member: Member | null;
  }>({
    isOpen: false,
    member: null
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && (data.user.role === 'SOCIETY_ADMIN' || data.user.role === 'ADMIN')) {
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

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoadingMembers(true);
      let targetSocietyId = societyId;
      
      // If no societyId in URL, get it from user's society (for SOCIETY_ADMIN)
      if (!targetSocietyId && user?.role === 'SOCIETY_ADMIN') {
        const userResponse = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        const userData = await userResponse.json();
        
        if (userData.success) {
          // Get user's society ID from database
          const societyResponse = await fetch('/api/society-admin/settings', {
            credentials: 'include'
          });
          const societyData = await societyResponse.json();
          
          if (societyData.success && societyData.society) {
            targetSocietyId = societyData.society.id;
          }
        }
      }
      
      if (targetSocietyId) {
        console.log('Fetching members for society ID:', targetSocietyId);
        const membersResponse = await fetch(`/api/society-admin/members?societyId=${targetSocietyId}`, {
          credentials: 'include'
        });
        const membersData = await membersResponse.json();
        console.log('Members API response:', membersData);
        
        if (membersData.success) {
          console.log('Raw members data:', membersData.members);
          // Transform API data to match component interface
          const transformedMembers: Member[] = membersData.members.map((member: Record<string, unknown>) => ({
            id: member.id as string,
            firstName: (member.firstName as string) || '',
            lastName: (member.lastName as string) || '',
            email: (member.email as string) || '',
            phone: (member.phone as string) || '',
            isActive: (member.status as string) === 'ACTIVE',
            joinedAt: member.createdAt as string,
            duesStatus: 'paid' as const, // This would need to be calculated based on actual dues data
            lastPaymentDate: (member.lastLoginAt as string) || undefined,
            flatNumber: (member.flatNumber as string) || '',
            blockNumber: (member.blockNumber as string) || '',
            memberType: (member.memberType as 'OWNER' | 'TENANT') || 'OWNER',
            isSecretary: (member.isSecretary as boolean) || false,
            status: (member.status as string) || 'ACTIVE',
            // Document status fields
            agreementDocumentStatus: member.agreementDocumentStatus,
            policyVerificationDocumentStatus: member.policyVerificationDocumentStatus,
            policyVerificationDeadline: member.policyVerificationDeadline
          }));
          setMembers(transformedMembers);
        } else {
          console.error('Error fetching members:', membersData.message);
          setMembers([]);
        }
      } else {
        console.error('No society ID available');
        setMembers([]);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [societyId, user]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Get society ID from URL parameters
    const societyIdParam = searchParams.get('societyId');
    if (societyIdParam) {
      setSocietyId(societyIdParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user, societyId, fetchMembers]);

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
        member.phone?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleDocumentStatusUpdate = (member: Member) => {
    setDocumentStatusModal({
      isOpen: true,
      member
    });
  };

  const updateDocumentStatus = async (memberId: string, documentType: string, status: string, comments?: string) => {
    try {
      const response = await fetch(`/api/society-admin/members/${memberId}/documents`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          documentType,
          status,
          comments
        })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh members list
        fetchMembers();
        alert('Document status updated successfully!');
      } else {
        alert('Failed to update document status: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      alert('Failed to update document status');
    }
  };

  const confirmDeleteMember = async () => {
    if (!deleteDialog.member) return;

    setDeleteDialog(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch(`/api/society-admin/members?memberId=${deleteDialog.member.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
      setMembers(members.filter(member => member.id !== deleteDialog.member!.id));
      setDeleteDialog({ isOpen: false, member: null, isLoading: false });
      } else {
        console.error('Error deleting member:', data.message);
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


  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading members..." />;
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600 mt-1">Manage society members and track their information</p>
        </div>
        <a
          href={societyId ? `/society-admin/${societyId}/members/add` : '/society-admin/members/add'}
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

        </div>
      </div>

      {/* Members List */}
      {isLoadingMembers ? (
        <TableSkeleton rows={5} columns={7} />
      ) : filteredMembers.length === 0 ? (
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
            href={societyId ? `/society-admin/${societyId}/members/add` : '/society-admin/members/add'}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Your First Member
              </a>
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
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-blue-600">
                              {member.firstName[0]}{member.lastName[0]}
                            </span>
                          </div>
                          <div>
                        <div className="text-sm font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.flatNumber && member.blockNumber 
                        ? `Flat ${member.flatNumber}, Block ${member.blockNumber}`
                        : 'N/A'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">
                        {member.memberType === 'OWNER' ? 'Owner' : 'Tenant'}
                      </span>
                      {member.isSecretary && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Secretary
                        </span>
                      )}
                    </div>
                    {/* Document Status for Tenants */}
                    {member.memberType === 'TENANT' && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-xs">
                          <span className="text-gray-600 mr-2">Rent Agreement:</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            member.agreementDocumentStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            member.agreementDocumentStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {member.agreementDocumentStatus || 'PENDING'}
                          </span>
                        </div>
                        <div className="flex items-center text-xs">
                          <span className="text-gray-600 mr-2">Policy Verification:</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            member.policyVerificationDocumentStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            member.policyVerificationDocumentStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            member.policyVerificationDocumentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {member.policyVerificationDocumentStatus || 'NOT UPLOADED'}
                          </span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          member.isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                        }`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* View Details Button */}
                      <button
                        onClick={() => router.push(`/society-admin/members/${member.id}`)}
                        className="text-green-600 hover:text-green-900 transition-colors p-2 hover:bg-green-50 rounded-lg"
                        title="View member details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {/* Document Status Button for Tenants */}
                      {member.memberType === 'TENANT' && (
                        <button
                          onClick={() => handleDocumentStatusUpdate(member)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                          title="Update document status"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      )}
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteMember(member)}
                        className="text-red-600 hover:text-red-900 transition-colors p-2 hover:bg-red-50 rounded-lg"
                        title="Delete member"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

      {/* Document Status Modal */}
      <DocumentStatusModal
        isOpen={documentStatusModal.isOpen}
        onClose={() => setDocumentStatusModal({ isOpen: false, member: null })}
        member={documentStatusModal.member}
        onStatusUpdate={updateDocumentStatus}
      />
    </div>
  );
}
