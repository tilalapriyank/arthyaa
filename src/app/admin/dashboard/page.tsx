'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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

interface Society {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    society: Society | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    society: null,
    isLoading: false
  });
  const router = useRouter();

  // Helper function to validate URLs
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.user.role === 'ADMIN') {
        setUser(data.user);
      } else {
        router.push('/admin/login');
      }
    } catch {
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchSocieties();
    }
  }, [user]);

  const fetchSocieties = async () => {
    try {
      const response = await fetch('/api/admin/societies', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setSocieties(data.societies);
      }
    } catch (error) {
      console.error('Error fetching societies:', error);
    }
  };


  const handleDeleteSociety = (society: Society) => {
    setDeleteDialog({
      isOpen: true,
      society,
      isLoading: false
    });
  };

  const confirmDeleteSociety = async () => {
    if (!deleteDialog.society) return;

    setDeleteDialog(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch(`/api/admin/societies/${deleteDialog.society.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSocieties(societies.filter(society => society.id !== deleteDialog.society!.id));
        setDeleteDialog({ isOpen: false, society: null, isLoading: false });
      } else {
        alert(data.message || 'Failed to delete society');
        setDeleteDialog(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error deleting society:', error);
      alert('Failed to delete society');
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const closeDeleteDialog = () => {
    if (!deleteDialog.isLoading) {
      setDeleteDialog({ isOpen: false, society: null, isLoading: false });
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
            {/* Page Title */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            </div>

            {/* Key Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Societies */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Societies</p>
                    <p className="text-3xl font-bold text-gray-900">{societies.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Members */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Members</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {societies.reduce((total, society) => total + (society._count?.users || 0), 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Companies */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Companies</p>
                    <p className="text-3xl font-bold text-gray-900">{societies.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

        {/* Active Societies */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Societies</p>
              <p className="text-3xl font-bold text-gray-900">{societies.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

      {/* Recent Societies Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
                  <div>
              <h3 className="text-xl font-bold text-gray-900">Recently Added Societies</h3>
              <p className="text-gray-600">Latest societies created in the system</p>
                  </div>
                  <Link
              href="/admin/societies"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-blue-600 hover:text-blue-700 h-10 px-4 py-2"
                  >
              View All Societies
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

          {/* Recent Societies List */}
          <div className="space-y-4">
            {societies.slice(0, 5).length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No societies yet</h4>
                <p className="text-gray-600 mb-4">Create your first society to get started</p>
                      <Link
                        href="/admin/societies/add"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                  Create First Society
                      </Link>
                    </div>
                  ) : (
              societies.slice(0, 5).map((society) => (
                <div key={society.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    {society.logo && isValidUrl(society.logo) ? (
                      <Image
                        src={society.logo}
                        alt={`${society.name} logo`}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                        onError={(e) => {
                          console.error('Failed to load society logo:', society.logo);
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                            <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{society.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {society.city && society.state && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                            {society.city}, {society.state}
                          </span>
                        )}
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                          {society._count?.users || 0} members
                        </span>
                      </div>
                              </div>
                            </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/societies/${society.id}`}
                      className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </Link>
                    <span className="text-xs text-gray-500">
                      {new Date(society.createdAt).toLocaleDateString()}
                    </span>
                            <button
                              onClick={() => handleDeleteSociety(society)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Delete society"
                            >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteSociety}
        title="Delete Society"
        message="Are you sure you want to delete this society? This action cannot be undone."
        itemName={deleteDialog.society?.name || ''}
        isLoading={deleteDialog.isLoading}
      />
    </div>
  );
}