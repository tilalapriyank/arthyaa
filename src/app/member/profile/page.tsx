'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import FileUpload from '@/components/FileUpload';

interface Member {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  occupation?: string;
  profileImage?: string;
  documents?: Document[];
  isSecretary?: boolean;
  societyId?: string;
  flatNumber?: string;
  blockNumber?: string;
  societyName?: string;
  // Additional fields from admin view
  isActive?: boolean;
  joinedAt?: string;
  memberType?: 'OWNER' | 'TENANT';
  status?: string;
  // Document status fields for tenants
  agreementDocumentStatus?: string;
  policyVerificationDocumentStatus?: string;
  policyVerificationDeadline?: string;
  agreementDocument?: string;
  policyVerificationDocument?: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export default function MemberProfile() {
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    occupation: '',
  });

  useEffect(() => {
    fetchMemberProfile();
  }, []);

  const fetchMemberProfile = async () => {
    try {
      // First get the current user info
      const authResponse = await fetch('/api/auth/me');
      const authData = await authResponse.json();
      
      if (!authData.success) {
        setError('Authentication failed');
        return;
      }

      // Then get the detailed profile
      const response = await fetch('/api/member/profile');
      const data = await response.json();
      
      if (data.success) {
        setMember(data.member);
        setFormData({
          firstName: data.member.firstName || '',
          lastName: data.member.lastName || '',
          phone: data.member.phone || '',
          dateOfBirth: data.member.dateOfBirth || '',
          address: data.member.address || '',
          emergencyContact: data.member.emergencyContact || '',
          emergencyPhone: data.member.emergencyPhone || '',
          occupation: data.member.occupation || '',
        });
      } else {
        setError(data.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsUploading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/member/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMember(data.member);
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setIsUploading(false);
    }
  };


  const handleDocumentUpload = async (file: File, documentType: string) => {
    try {
      setIsUploading(true);
      setError(null);
      // setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', documentType);

      const response = await fetch('/api/member/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Update the specific document field based on type
        if (documentType === 'AGREEMENT') {
          setMember(prev => prev ? {
            ...prev,
            agreementDocument: data.document.url,
            agreementDocumentStatus: 'PENDING'
          } : null);
        } else if (documentType === 'POLICY_VERIFICATION') {
          setMember(prev => prev ? {
            ...prev,
            policyVerificationDocument: data.document.url,
            policyVerificationDocumentStatus: 'PENDING'
          } : null);
        }
        
        setSuccess('Document uploaded successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Failed to upload document');
    } finally {
      setIsUploading(false);
      // setUploadProgress(0);
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


  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading profile..." />;
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Failed to load profile</p>
          <button
            onClick={() => router.push('/member/dashboard')}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-lg text-gray-600">Manage your personal information and documents</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  member.isActive ? 'bg-green-400' : 'bg-gray-400'
                }`}></div>
                {member.isActive ? 'Active' : 'Inactive'}
              </span>
              {member.isSecretary && (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Secretary
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-20 z-10">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-violet-600 to-blue-600 p-6 text-white relative">
                <div className="text-center">
                  {/* Profile Image */}
                  <div className="relative inline-block mb-4">
                    {member.profileImage ? (
                      <Image
                        src={member.profileImage}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white shadow-lg">
                        <span className="text-2xl font-bold text-white">
                          {member.firstName?.[0] || member.email?.[0]?.toUpperCase() || 'M'}
                          {member.lastName?.[0] || ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <h2 className="text-xl font-bold mb-1">
                    {member.firstName && member.lastName 
                      ? `${member.firstName} ${member.lastName}`
                      : member.email?.split('@')[0] || 'Member'
                    }
                  </h2>
                  <p className="text-white/80 text-sm">{member.email}</p>
                  {member.phone && <p className="text-white/80 text-sm">{member.phone}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Member Type Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Member Type</p>
                    <p className="text-lg font-bold text-gray-900">
                      {member.memberType === 'OWNER' ? 'Owner' : member.memberType === 'TENANT' ? 'Tenant' : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Property Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Property</p>
                    <p className="text-lg font-bold text-gray-900">
                      {member.flatNumber ? `Flat ${member.flatNumber}` : 'Not assigned'}
                    </p>
                    {member.blockNumber && (
                      <p className="text-sm text-gray-500">Block {member.blockNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Society Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Society</p>
                    <p className="text-lg font-bold text-gray-900">{member.societyName || 'Not assigned'}</p>
                    {member.joinedAt && (
                      <p className="text-sm text-gray-500">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                      <p className="text-sm text-gray-600">Your personal details and contact information</p>
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Contact
                      </label>
                      <input
                        type="text"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Phone
                      </label>
                      <input
                        type="tel"
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isUploading}
                      className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md transition-colors disabled:opacity-50"
                    >
                      {isUploading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">First Name</label>
                      <p className="text-sm text-gray-900">{member.firstName || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Last Name</label>
                      <p className="text-sm text-gray-900">{member.lastName || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                      <p className="text-sm text-gray-900">{member.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-sm text-gray-900">
                        {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Address</label>
                    <p className="text-sm text-gray-900">{member.address || 'Not provided'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Emergency Contact</label>
                      <p className="text-sm text-gray-900">{member.emergencyContact || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Emergency Phone</label>
                      <p className="text-sm text-gray-900">{member.emergencyPhone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Occupation</label>
                    <p className="text-sm text-gray-900">{member.occupation || 'Not provided'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Property Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Property Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Member Type</label>
                  <p className="text-sm text-gray-900">
                    {member.memberType === 'OWNER' ? 'Owner' : member.memberType === 'TENANT' ? 'Tenant' : 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Joined Date</label>
                  <p className="text-sm text-gray-900">
                    {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Not available'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Flat Number</label>
                  <p className="text-sm text-gray-900">{member.flatNumber || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Block Number</label>
                  <p className="text-sm text-gray-900">{member.blockNumber || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Society</label>
                  <p className="text-sm text-gray-900">{member.societyName || 'Not assigned'}</p>
                </div>
              </div>
            </div>
          </div>

            {/* Document Status for Tenants */}
            {member.memberType === 'TENANT' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Document Status</h3>
                      <p className="text-sm text-gray-600">Your document verification status</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Rent Agreement */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">Rent Agreement</h4>
                            <p className="text-xs text-gray-600">Rental agreement document</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          member.agreementDocumentStatus || 'PENDING'
                        )}`}>
                          {member.agreementDocumentStatus || 'PENDING'}
                        </span>
                      </div>
                      
                      {member.agreementDocument ? (
                        <a 
                          href={member.agreementDocument} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Document
                        </a>
                      ) : (
                        <div className="mb-3">
                          <FileUpload
                            onUpload={(file: File) => handleDocumentUpload(file, 'AGREEMENT')}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            maxSize={10}
                            category="document"
                            disabled={isUploading}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>

                    {/* Policy Verification */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">Policy Verification</h4>
                            <p className="text-xs text-gray-600">ID proof and verification</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          member.policyVerificationDocumentStatus || 'NOT UPLOADED'
                        )}`}>
                          {member.policyVerificationDocumentStatus || 'NOT UPLOADED'}
                        </span>
                      </div>
                      
                      {member.policyVerificationDocument ? (
                        <a 
                          href={member.policyVerificationDocument} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-green-600 hover:text-green-800 font-medium mb-2"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Document
                        </a>
                      ) : (
                        <div className="mb-3">
                          <FileUpload
                            onUpload={(file: File) => handleDocumentUpload(file, 'POLICY_VERIFICATION')}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            maxSize={10}
                            category="document"
                            disabled={isUploading}
                            className="w-full"
                          />
                        </div>
                      )}
                      
                      {member.policyVerificationDeadline && member.policyVerificationDocumentStatus !== 'APPROVED' && (
                        <div className="text-xs text-gray-500 bg-white/50 rounded-lg p-2">
                          <strong>Deadline:</strong> {new Date(member.policyVerificationDeadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
