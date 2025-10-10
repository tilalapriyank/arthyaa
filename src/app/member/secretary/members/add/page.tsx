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
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  flatId: string;
  blockId: string;
  memberType: string;
  isSecretary: boolean;
  rentAgreement: File | null;
  idProof: File | null;
}

export default function SecretaryAddMemberPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    flatId: '',
    blockId: '',
    memberType: 'OWNER',
    isSecretary: false,
    rentAgreement: null,
    idProof: null
  });
  const [blocks, setBlocks] = useState<Array<{id: string, name: string}>>([]);
  const [flats, setFlats] = useState<Array<{id: string, name: string, floorNumber: number}>>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingFlats, setLoadingFlats] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch blocks when user is loaded
  useEffect(() => {
    if (user?.societyId) {
      fetchBlocks();
    }
  }, [user]);

  // Fetch flats when block is selected
  useEffect(() => {
    if (formData.blockId) {
      fetchFlats(formData.blockId);
    } else {
      setFlats([]);
    }
  }, [formData.blockId]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.user.role === 'MEMBER' && data.user.isSecretary) {
        setUser(data.user);
      } else {
        router.push('/member/dashboard');
      }
    } catch {
      router.push('/member/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlocks = async () => {
    setLoadingBlocks(true);
    try {
      const response = await fetch(`/api/member/secretary/blocks?societyId=${user?.societyId}`, {
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
      const response = await fetch(`/api/member/secretary/flats?blockId=${blockId}`, {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // If block is changed, reset flat selection
    if (name === 'blockId') {
      setFormData(prev => ({
        ...prev,
        blockId: value,
        flatId: '' // Reset flat selection when block changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add basic form data
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('flatId', formData.flatId);
      submitData.append('blockId', formData.blockId);
      submitData.append('memberType', formData.memberType);
      submitData.append('isSecretary', formData.isSecretary.toString());
      
      // Add files if they exist (for tenants)
      if (formData.rentAgreement) {
        submitData.append('rentAgreement', formData.rentAgreement);
      }
      if (formData.idProof) {
        submitData.append('idProof', formData.idProof);
      }

      const response = await fetch('/api/member/secretary/members', {
        method: 'POST',
        credentials: 'include',
        body: submitData
      });

      const data = await response.json();

      if (data.success) {
        alert('Member added successfully!');
        router.push('/member/secretary/members');
      } else {
        alert('Failed to add member: ' + data.message);
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading add member form..." />;
  }

  return (
    <div className="w-full">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Member</h1>
        <p className="text-gray-600">Add a new member to your society</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Block *</label>
                  <select
                    name="blockId"
                    value={formData.blockId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                    disabled={loadingBlocks}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Flat *</label>
                  <select
                    name="flatId"
                    value={formData.flatId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                    disabled={!formData.blockId || loadingFlats}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Member Type *</label>
                  <select
                    name="memberType"
                    value={formData.memberType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  >
                    <option value="OWNER">Owner</option>
                    <option value="TENANT">Tenant</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Document Upload for Tenants */}
            {formData.memberType === 'TENANT' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rent Agreement *
                    </label>
                    <input
                      type="file"
                      name="rentAgreement"
                      onChange={handleInputChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload rent agreement document (PDF, DOC, DOCX, JPG, PNG)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Verification Document
                      <span className="text-orange-600 text-sm ml-1">(Optional - 1 month deadline)</span>
                    </label>
                    <input
                      type="file"
                      name="idProof"
                      onChange={handleInputChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload policy verification document (PDF, DOC, DOCX, JPG, PNG)
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-violet-50 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-violet-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-violet-800">Document Requirements for Tenants</h4>
                      <ul className="text-xs text-violet-700 mt-1 space-y-1">
                        <li>• <strong>Rent Agreement:</strong> Required - Must be valid and signed by both parties</li>
                        <li>• <strong>Policy Verification:</strong> Optional - Can be uploaded within 1 month of registration</li>
                        <li>• <strong>File Size:</strong> Maximum 10MB per document</li>
                        <li>• <strong>Formats:</strong> PDF, DOC, DOCX, JPG, PNG</li>
                        <li>• <strong>Note:</strong> Policy verification document deadline is 1 month from registration date</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isSecretary"
                    checked={formData.isSecretary}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Make this member a secretary
                  </label>
                </div>
                <div className="text-sm text-gray-500">
                  <p>• Members are automatically activated upon creation</p>
                  <p>• Secretary members have additional administrative privileges</p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/member/secretary/members')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Adding Member...
                  </>
                ) : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
