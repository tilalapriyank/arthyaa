'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

export default function SocietiesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [filteredSocieties, setFilteredSocieties] = useState<Society[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSocieties();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortSocieties();
  }, [societies, searchTerm, filterState, sortBy]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.user.role === 'ADMIN') {
        setUser(data.user);
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSocieties = async () => {
    try {
      const response = await fetch('/api/admin/societies', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSocieties(data.societies);
      }
    } catch (error) {
      console.error('Error fetching societies:', error);
    }
  };

  const filterAndSortSocieties = () => {
    let filtered = [...societies];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(society =>
        society.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        society.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        society.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        society.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // State filter
    if (filterState !== 'all') {
      filtered = filtered.filter(society => society.state === filterState);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return (b._count?.users || 0) - (a._count?.users || 0);
        default:
          return 0;
      }
    });

    setFilteredSocieties(filtered);
  };

  const handleDeleteSociety = async (societyId: string) => {
    if (!confirm('Are you sure you want to delete this society? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/societies/${societyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSocieties(societies.filter(society => society.id !== societyId));
      } else {
        alert(data.message || 'Failed to delete society');
      }
    } catch (error) {
      console.error('Error deleting society:', error);
      alert('Failed to delete society');
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
        <h1 className="text-3xl font-bold text-gray-900">Society Management</h1>
        <p className="text-gray-600">Manage all societies in the system</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search societies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full"
            />
          </div>

          {/* State Filter */}
          <div>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="all">All States</option>
              {Array.from(new Set(societies.map(s => s.state).filter(Boolean))).map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="members">Most Members</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredSocieties.length} of {societies.length} societies
            {searchTerm && ` matching "${searchTerm}"`}
          </span>
          {(searchTerm || filterState !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterState('all');
                setSortBy('newest');
              }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-blue-600 hover:text-blue-700 h-10 px-4 py-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Add New Society Button */}
      <div className="flex justify-end mb-6">
        <a
          href="/admin/societies/add"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Society
        </a>
      </div>

      {/* Societies List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-8">
          {filteredSocieties.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {societies.length === 0 ? 'No societies yet' : 'No societies found'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {societies.length === 0 
                  ? 'Get started by creating your first society. You can manage all societies from this dashboard.'
                  : 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                }
              </p>
              <a
                href="/admin/societies/add"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Society
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSocieties.map((society) => (
                <div key={society.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{society.name}</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        {society.address && (
                          <p className="flex items-start">
                            <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="line-clamp-2">{society.address}</span>
                          </p>
                        )}
                        {(society.city || society.state) && (
                          <p className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {[society.city, society.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {society.pincode && (
                          <p className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 4h6" />
                            </svg>
                            {society.pincode}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSociety(society.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                      title="Delete society"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{society._count?.users || 0}</p>
                        <p className="text-xs text-gray-500">members</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Created {new Date(society.createdAt).toLocaleDateString()}
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
