'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';


export default function AddMemberPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [societyId, setSocietyId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    flatId: '',
    blockId: '',
    memberType: 'OWNER' as 'OWNER' | 'TENANT',
    isSecretary: false
  });
  const [blocks, setBlocks] = useState<Array<{id: string, name: string}>>([]);
  const [flats, setFlats] = useState<Array<{id: string, name: string, floorNumber: number}>>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingFlats, setLoadingFlats] = useState(false);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && (data.user.role === 'SOCIETY_ADMIN' || data.user.role === 'ADMIN')) {
        if (data.user.societyId) {
          setSocietyId(data.user.societyId);
          // Redirect to the correct route with society ID
          router.push(`/society-admin/${data.user.societyId}/members/add`);
          return;
        } else if (data.user.role === 'SOCIETY_ADMIN') {
          // If SOCIETY_ADMIN but no societyId, redirect to dashboard
          router.push('/society-admin/dashboard');
          return;
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

  const fetchBlocks = useCallback(async () => {
    setLoadingBlocks(true);
    try {
      console.log('Fetching blocks for society ID:', societyId);
      const response = await fetch(`/api/society-admin/blocks?societyId=${societyId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      console.log('Blocks API response:', data);
      
      if (data.success) {
        setBlocks(data.blocks);
        console.log('Blocks loaded:', data.blocks);
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
  }, [societyId]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch blocks when societyId is available
  useEffect(() => {
    if (societyId) {
      fetchBlocks();
    }
  }, [societyId, fetchBlocks]);

  // Fetch flats when block is selected
  useEffect(() => {
    if (formData.blockId) {
      fetchFlats(formData.blockId);
    } else {
      setFlats([]);
    }
  }, [formData.blockId]);

  const fetchFlats = async (blockId: string) => {
    setLoadingFlats(true);
    try {
      const response = await fetch(`/api/society-admin/flats?blockId=${blockId}`, {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/society-admin/members?societyId=${societyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Member added successfully!');
        router.push('/society-admin/members');
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!societyId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-orange-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Society Found</h1>
          <p className="text-gray-600 mb-4">You are not associated with any society.</p>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/society-admin/dashboard')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Page Title */}
      <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Member</h1>
        <p className="text-gray-600">Add a new member to your society</p>
        <p className="text-sm text-gray-500">Society ID: {societyId}</p>
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="OWNER">Owner</option>
                    <option value="TENANT">Tenant</option>
                  </select>
                </div>
              </div>
                </div>

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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                onClick={() => router.push('/society-admin/members')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding Member...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}