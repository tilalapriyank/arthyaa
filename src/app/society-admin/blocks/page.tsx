'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface User {
  id: string;
  email?: string;
  phone?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isSecretary?: boolean;
}

interface Block {
  id: string;
  name: string;
  societyId: string;
  flats?: Flat[];
  _count?: {
    flats: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Flat {
  id: string;
  name: string;
  floorNumber: number;
  blockId: string;
  block: Block;
  createdAt: string;
  updatedAt: string;
}

export default function BlocksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [loadingFlats, setLoadingFlats] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const societyId = searchParams.get('societyId');

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

  const fetchBlocks = useCallback(async () => {
    try {
      setLoadingBlocks(true);
      let url = '/api/society-admin/blocks';
      if (societyId) {
        url += `?societyId=${societyId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setBlocks(data.blocks);
      } else {
        setError(data.message || 'Failed to fetch blocks');
      }
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setError('Failed to fetch blocks');
    } finally {
      setLoadingBlocks(false);
    }
  }, [societyId]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchBlocks();
    }
  }, [user, societyId, fetchBlocks]);

  const fetchFlats = async (blockId: string) => {
    try {
      setLoadingFlats(true);
      const response = await fetch(`/api/society-admin/flats?blockId=${blockId}`);
      const data = await response.json();
      
      if (data.success) {
        setFlats(data.flats);
      } else {
        setError(data.message || 'Failed to fetch flats');
      }
    } catch (error) {
      console.error('Error fetching flats:', error);
      setError('Failed to fetch flats');
    } finally {
      setLoadingFlats(false);
    }
  };

  const handleBlockClick = (block: Block) => {
    setSelectedBlock(block);
    fetchFlats(block.id);
  };

  const handleEdit = (block: Block) => {
    setEditingBlock(block);
    setEditFormData({ name: block.name });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingBlock(null);
    setEditFormData({ name: '' });
  };

  const handleSave = async () => {
    if (!editingBlock) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/society-admin/blocks/${editingBlock.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Block updated successfully!');
        setIsEditing(false);
        setEditingBlock(null);
        setEditFormData({ name: '' });
        fetchBlocks(); // Refresh blocks list
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to update block');
      }
    } catch (error) {
      console.error('Error updating block:', error);
      setError('Failed to update block');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'SOCIETY_ADMIN' && user.role !== 'ADMIN')) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Blocks</h1>
        <p className="text-gray-600 mt-1">Manage blocks and view flats for each block</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modern Blocks Management UI */}
      <div className="space-y-8">
        {/* Header Section */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Blocks List - Left Column */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Blocks</h2>
                  <div className="text-sm text-gray-500">
                    {blocks.length} total
                  </div>
                </div>
              </div>
              <div className="p-6">
                {loadingBlocks ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 font-medium">Loading blocks...</p>
                    </div>
                  </div>
                ) : blocks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No blocks found</h3>
                    <p className="text-gray-500">Create your first block to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blocks.map((block) => (
                      <div
                        key={block.id}
                        className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedBlock?.id === block.id
                            ? 'bg-blue-50 border-2 border-blue-200 shadow-md'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-blue-50 hover:border-blue-100 hover:shadow-sm'
                        }`}
                        onClick={() => handleBlockClick(block)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                selectedBlock?.id === block.id ? 'bg-blue-500' : 'bg-gray-300'
                              }`}></div>
                              <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                  {block.name}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {block._count?.flats || 0} flats
                                </p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(block);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Flats List - Right Column */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedBlock ? `${selectedBlock.name} Flats` : 'Select a Block'}
                    </h2>
                    {selectedBlock && (
                      <p className="text-sm text-gray-500 mt-1">
                        {flats.length} flats in this block
                      </p>
                    )}
                  </div>
                  {selectedBlock && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Active Block</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                {!selectedBlock ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Block</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Choose a block from the left panel to view its flats and manage the property details.
                    </p>
                  </div>
                ) : loadingFlats ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 font-medium">Loading flats...</p>
                    </div>
                  </div>
                ) : flats.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No flats found</h3>
                    <p className="text-gray-500">This block doesn&apos;t have any flats yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {flats.map((flat) => (
                      <div key={flat.id} className="group bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg">{flat.name}</h3>
                              <p className="text-sm text-gray-500">Floor {flat.floorNumber}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {flat.block?.name || 'Unknown Block'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Edit Modal */}
      {isEditing && editingBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
              <h3 className="text-xl font-bold">Edit Block</h3>
              <p className="text-blue-100 text-sm">Update the block name</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="blockName" className="block text-sm font-semibold text-gray-700 mb-3">
                    Block Name
                  </label>
                  <input
                    type="text"
                    id="blockName"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter block name"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 font-medium shadow-lg"
                  >
                    {saving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
