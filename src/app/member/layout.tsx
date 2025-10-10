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

export default function MemberLayout({
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

      if (data.success && data.user.role === 'MEMBER') {
        setUser(data.user);
      } else {
        router.push('/');
      }
    } catch (error) {
      router.push('/');
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
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('auth-token');
      setUser(null);
      router.push('/');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading member dashboard..." />;
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
                  pathname === '/member/dashboard' 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/member/dashboard"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname === '/member/dashboard' ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 22 21" fill="none">
                    <path d="M2.74415 5.63814L8.74415 1.54058C10.1046 0.611517 11.8954 0.611515 13.2558 1.54058L19.2558 5.63814C20.3472 6.38347 21 7.61975 21 8.94134V16C21 18.2091 19.2091 20 17 20H5C2.79086 20 1 18.2091 1 16V8.94134C1 7.61975 1.65278 6.38347 2.74415 5.63814Z" stroke="currentColor"></path>
                    <path d="M11 13L11 17" stroke="currentColor" strokeLinecap="round"></path>
                  </svg>
                </div>
                <span className="flex-1">Dashboard</span>
              </Link>
            </nav>
          </div>

          <div className="px-3 py-2">
            <p className="px-1 text-xs font-normal text-gray-500 uppercase tracking-wider">SERVICES</p>
            <nav className="mt-2 space-y-1">
              <Link 
                title="My Profile" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/member/profile') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/member/profile"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/member/profile') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></circle>
                  </svg>
                </div>
                <span className="flex-1">My Profile</span>
              </Link>

              <Link 
                title="Dues & Payments" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/member/dues') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/member/dues"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/member/dues') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></circle>
                  </svg>
                </div>
                <span className="flex-1">Dues & Payments</span>
              </Link>

              <Link 
                title="Maintenance Requests" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/member/maintenance') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/member/maintenance"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/member/maintenance') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <span className="flex-1">Maintenance Requests</span>
              </Link>

              <Link 
                title="Amenities Booking" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/member/amenities') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/member/amenities"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/member/amenities') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></rect>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></line>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></line>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></line>
                  </svg>
                </div>
                <span className="flex-1">Amenities Booking</span>
              </Link>

              <Link 
                title="Receipts" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/member/receipts') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/member/receipts"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/member/receipts') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></line>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></line>
                    <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></polyline>
                  </svg>
                </div>
                <span className="flex-1">Receipts</span>
              </Link>
            </nav>
          </div>

          {/* Secretary Section - Only show if user is secretary */}
          {user?.isSecretary && (
            <div className="px-3 py-2">
              <p className="px-1 text-xs font-normal text-gray-500 uppercase tracking-wider">SECRETARY</p>
              <nav className="mt-2 space-y-1">
                <Link 
                  title="All Members" 
                  className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                    pathname.startsWith('/member/secretary/members') 
                      ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                      : 'text-[#45474B] hover:bg-gray-50'
                  }`} 
                  href="/member/secretary/members"
                >
                  <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                    pathname.startsWith('/member/secretary/members') ? 'text-violet-600' : 'text-[#45474B]'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <span className="flex-1">All Members</span>
                </Link>

                <Link 
                  title="Add Member" 
                  className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                    pathname.startsWith('/member/secretary/members/add') 
                      ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                      : 'text-[#45474B] hover:bg-gray-50'
                  }`} 
                  href="/member/secretary/members/add"
                >
                  <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                    pathname.startsWith('/member/secretary/members/add') ? 'text-violet-600' : 'text-[#45474B]'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                      <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></circle>
                      <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></line>
                      <line x1="17" y1="11" x2="23" y2="11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></line>
                    </svg>
                  </div>
                  <span className="flex-1">Add Member</span>
                </Link>
              </nav>
            </div>
          )}

          <div className="px-3 py-2">
            <p className="px-1 text-xs font-normal text-gray-500 uppercase tracking-wider">COMMUNITY</p>
            <nav className="mt-2 space-y-1">
              <Link 
                title="Notifications" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/member/notifications') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/member/notifications"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/member/notifications') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <span className="flex-1">Notifications</span>
              </Link>

              <Link 
                title="Announcements" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/member/announcements') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/member/announcements"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/member/announcements') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <span className="flex-1">Announcements</span>
              </Link>

              <Link 
                title="Community Forum" 
                className={`flex items-center p-3 text-sm font-medium rounded-md cursor-pointer ${
                  pathname.startsWith('/member/forum') 
                    ? 'text-black bg-gray-50 shadow-sm border border-gray-200' 
                    : 'text-[#45474B] hover:bg-gray-50'
                }`} 
                href="/member/forum"
              >
                <div className={`h-4 w-4 flex-shrink-0 mr-1.5 ${
                  pathname.startsWith('/member/forum') ? 'text-violet-600' : 'text-[#45474B]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <span className="flex-1">Community Forum</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* User Profile at Bottom */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <span className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10">
              <span className="flex h-full w-full items-center justify-center rounded-full bg-violet-100 text-violet-600 font-semibold text-sm">
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'M'}
                {user?.lastName?.[0] || ''}
              </span>
            </span>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0] || 'Member'
                }
                {user?.isSecretary && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">Secretary</span>
                )}
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
