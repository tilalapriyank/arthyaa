'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

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
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }
    checkAuth();
  }, [pathname, checkAuth]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('auth-token');
      setUser(null);
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('auth-token');
      setUser(null);
      router.push('/admin/login');
    }
  };

  // If it's the login page, render without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading admin dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col transition-all duration-300 ease-in-out h-screen fixed left-0 top-0 overflow-y-auto" style={{background: 'linear-gradient(181.23deg, rgba(245, 247, 249, 0.7) 0.75%, rgba(236, 239, 247, 0.63) 17.73%, rgba(234, 234, 247, 0.63) 34.42%, rgba(234, 230, 245, 0.7) 50.42%, rgba(238, 228, 242, 0.7) 66.42%, rgba(247, 237, 243, 0.7) 81.23%, rgba(242, 235, 238, 0.7) 99.25%)'}}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between relative">
          <div className="flex items-center">
            <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-600">Arthyaa</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2">
            <p className="px-1 text-xs font-normal text-gray-500 uppercase tracking-wider">GENERAL</p>
            <nav className="mt-2 space-y-1">
              <Link 
                title="Dashboard" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname === '/admin/dashboard' 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/admin/dashboard"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname === '/admin/dashboard' ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 22 21" fill="none">
                    <path d="M2.74415 5.63814L8.74415 1.54058C10.1046 0.611517 11.8954 0.611515 13.2558 1.54058L19.2558 5.63814C20.3472 6.38347 21 7.61975 21 8.94134V16C21 18.2091 19.2091 20 17 20H5C2.79086 20 1 18.2091 1 16V8.94134C1 7.61975 1.65278 6.38347 2.74415 5.63814Z" stroke="currentColor"></path>
                    <path d="M11 13L11 17" stroke="currentColor" strokeLinecap="round"></path>
                  </svg>
                </div>
                <span className="flex-1">Dashboard</span>
              </Link>
              
              <Link 
                title="Society Management" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/admin/societies') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/admin/societies"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/admin/societies') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 22V4C6 3.46957 6.21071 2.96086 6.58579 2.58579C6.96086 2.21071 7.46957 2 8 2H16C16.5304 2 17.0391 2.21071 17.4142 2.58579C17.7893 2.96086 18 3.46957 18 4V22H6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M6 12H4C3.46957 12 2.96086 12.2107 2.58579 12.5858C2.21071 12.9609 2 13.4696 2 14V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M18 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V20C22 20.5304 21.7893 21.0391 21.4142 21.4142C21.0391 21.7893 20.5304 22 20 22H18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M10 6H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M10 10H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M10 14H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M10 18H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <span className="flex-1">Societies</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* User Profile at Bottom */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <span className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10">
              <span className="flex h-full w-full items-center justify-center rounded-full bg-violet-100 text-violet-600 font-semibold text-sm">
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}
                {user?.lastName?.[0] || ''}
              </span>
            </span>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0] || 'User'
                }
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'No email'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-end h-full px-4">
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded-md text-gray-600 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" x2="9" y1="12" y2="12"></line>
              </svg>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
