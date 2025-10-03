'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email?: string;
  phone?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isSecretary?: boolean;
}

export default function SocietyAdminLayout({
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

      if (data.success && data.user.role === 'SOCIETY_ADMIN') {
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
    checkAuth();
  }, [checkAuth]);

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
              <a 
                title="Dashboard" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname === '/society-admin/dashboard' 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/society-admin/dashboard"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname === '/society-admin/dashboard' ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 22 21" fill="none">
                    <path d="M2.74415 5.63814L8.74415 1.54058C10.1046 0.611517 11.8954 0.611515 13.2558 1.54058L19.2558 5.63814C20.3472 6.38347 21 7.61975 21 8.94134V16C21 18.2091 19.2091 20 17 20H5C2.79086 20 1 18.2091 1 16V8.94134C1 7.61975 1.65278 6.38347 2.74415 5.63814Z" stroke="currentColor"></path>
                    <path d="M11 13L11 17" stroke="currentColor" strokeLinecap="round"></path>
                  </svg>
                </div>
                <span className="flex-1">Dashboard</span>
              </a>
            </nav>
          </div>

          <div className="px-3 py-2">
            <p className="px-1 text-xs font-normal text-gray-500 uppercase tracking-wider">SOCIETY</p>
            <nav className="mt-2 space-y-1">
              <a 
                title="Members" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/society-admin/members') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/society-admin/members"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/society-admin/members') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <span className="flex-1">Members</span>
              </a>
              
              <a 
                title="Society Settings" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/society-admin/settings') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/society-admin/settings"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/society-admin/settings') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <span className="flex-1">Society Settings</span>
              </a>
            </nav>
          </div>

          <div className="px-3 py-2">
            <p className="px-1 text-xs font-normal text-gray-500 uppercase tracking-wider">FINANCE</p>
            <nav className="mt-2 space-y-1">
              <a 
                title="Financial Management" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/society-admin/finance') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/society-admin/finance"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/society-admin/finance') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <span className="flex-1">Financial Management</span>
              </a>
              
              <a 
                title="Dues Collection" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/society-admin/dues') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/society-admin/dues"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/society-admin/dues') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <span className="flex-1">Dues Collection</span>
              </a>
            </nav>
          </div>

          <div className="px-3 py-2">
            <p className="px-1 text-xs font-normal text-gray-500 uppercase tracking-wider">COMMUNICATION</p>
            <nav className="mt-2 space-y-1">
              <a 
                title="Notifications" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/society-admin/notifications') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/society-admin/notifications"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/society-admin/notifications') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 17h5l-5 5v-5z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <span className="flex-1">Notifications</span>
              </a>
              
              <a 
                title="Announcements" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/society-admin/announcements') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/society-admin/announcements"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/society-admin/announcements') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <span className="flex-1">Announcements</span>
              </a>
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
