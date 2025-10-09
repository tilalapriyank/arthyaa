'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import DocumentStatusModal from '@/components/DocumentStatusModal';

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
  agreementDocument?: string;
  policyVerificationDocument?: string;
}

export default function MemberDetailsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [societyId, setSocietyId] = useState<string | null>(null);
  const [documentStatusModal, setDocumentStatusModal] = useState<{
    isOpen: boolean;
    member: Member | null;
  }>({
    isOpen: false,
    member: null
  });
  const router = useRouter();
  const params = useParams();
  const memberId = params.memberId as string;

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && (data.user.role === 'SOCIETY_ADMIN' || data.user.role === 'ADMIN')) {
        setUser(data.user);
        
        // Get user's society ID
        if (data.user.role === 'SOCIETY_ADMIN') {
          const societyResponse = await fetch('/api/society-admin/settings', {
            credentials: 'include'
          });
          const societyData = await societyResponse.json();
          
          if (societyData.success && societyData.society) {
            setSocietyId(societyData.society.id);
          }
        }
      } else {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const fetchMemberDetails = useCallback(async () => {
    try {
      if (!memberId) return;
      
      setIsLoadingMember(true);
      console.log('Fetching member details for ID:', memberId);
      const response = await fetch(`/api/society-admin/members/${memberId}/documents`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.success) {
        const memberData = data.member;
        console.log('Member data from API:', memberData);
        
        const transformedMember: Member = {
          id: memberData.id,
          firstName: memberData.firstName || '',
          lastName: memberData.lastName || '',
          email: memberData.email || '',
          phone: memberData.phone || '',
          isActive: memberData.status === 'ACTIVE',
          joinedAt: memberData.createdAt || new Date().toISOString(),
          duesStatus: 'paid' as const,
          lastPaymentDate: memberData.lastLoginAt || undefined,
          flatNumber: memberData.flatNumber || '',
          blockNumber: memberData.blockNumber || '',
          memberType: memberData.memberType || 'OWNER',
          isSecretary: memberData.isSecretary || false,
          status: memberData.status || 'ACTIVE',
          agreementDocumentStatus: memberData.agreementDocumentStatus,
          policyVerificationDocumentStatus: memberData.policyVerificationDocumentStatus,
          policyVerificationDeadline: memberData.policyVerificationDeadline,
          agreementDocument: memberData.agreementDocument,
          policyVerificationDocument: memberData.policyVerificationDocument
        };
        
        console.log('Transformed member:', transformedMember);
        setMember(transformedMember);
      } else {
        console.error('Error fetching member details:', data.message);
        setMember(null);
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      setMember(null);
    } finally {
      setIsLoadingMember(false);
    }
  }, [memberId, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchMemberDetails();
    }
  }, [user, fetchMemberDetails]);

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
        // Refresh member details
        fetchMemberDetails();
        alert('Document status updated successfully!');
      } else {
        alert('Failed to update document status: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      alert('Failed to update document status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading || isLoadingMember) {
    return <LoadingSpinner fullScreen text="Loading member details..." />;
  }

  if (!member) {
    return (
      <div className="w-full">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Member Not Found</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            The member you're looking for doesn't exist or you don't have permission to view their details.
          </p>
          <button
            onClick={() => router.push('/society-admin/members')}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Members
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/society-admin/members')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to members"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {member.firstName} {member.lastName}
            </h1>
            <p className="text-gray-600 mt-1">Member Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            member.isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
          }`}>
            {member.isActive ? 'Active' : 'Inactive'}
          </span>
          {member.isSecretary && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Secretary
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <p className="text-sm text-gray-900">{member.firstName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <p className="text-sm text-gray-900">{member.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-sm text-gray-900">{member.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-sm text-gray-900">{member.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Type</label>
                <p className="text-sm text-gray-900">{member.memberType === 'OWNER' ? 'Owner' : 'Tenant'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
                <p className="text-sm text-gray-900">{new Date(member.joinedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flat Number</label>
                <p className="text-sm text-gray-900">{member.flatNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Block Number</label>
                <p className="text-sm text-gray-900">{member.blockNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Document Status for Tenants */}
          {member.memberType === 'TENANT' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Document Status</h2>
                <button
                  onClick={() => handleDocumentStatusUpdate(member)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Update Status
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Rent Agreement */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Rent Agreement</h3>
                    <p className="text-sm text-gray-600">Rental agreement document status</p>
                    {member.agreementDocument && (
                      <a 
                        href={member.agreementDocument} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View Document
                      </a>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    member.agreementDocumentStatus || 'PENDING'
                  )}`}>
                    {member.agreementDocumentStatus || 'PENDING'}
                  </span>
                </div>

                {/* Policy Verification */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Policy Verification</h3>
                    <p className="text-sm text-gray-600">ID proof and policy verification</p>
                    {member.policyVerificationDocument && (
                      <a 
                        href={member.policyVerificationDocument} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View Document
                      </a>
                    )}
                    {member.policyVerificationDeadline && (
                      <p className="text-xs text-gray-500 mt-1">
                        Deadline: {new Date(member.policyVerificationDeadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    member.policyVerificationDocumentStatus || 'NOT UPLOADED'
                  )}`}>
                    {member.policyVerificationDocumentStatus || 'NOT UPLOADED'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {member.memberType === 'TENANT' && (
                <button
                  onClick={() => handleDocumentStatusUpdate(member)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Update Document Status
                </button>
              )}
              <button
                onClick={() => window.open(`mailto:${member.email}`, '_blank')}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Email
              </button>
              {member.phone && (
                <button
                  onClick={() => window.open(`tel:${member.phone}`, '_blank')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Member
                </button>
              )}
            </div>
          </div>

          {/* Member Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-sm font-medium ${member.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type</span>
                <span className="text-sm font-medium text-gray-900">
                  {member.memberType === 'OWNER' ? 'Owner' : 'Tenant'}
                </span>
              </div>
              {member.isSecretary && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className="text-sm font-medium text-blue-600">Secretary</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
