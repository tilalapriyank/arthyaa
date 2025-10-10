'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  memberType: string;
  flatNumber: string;
  blockNumber: string;
  isSecretary: boolean;
}

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
  flatNumber: string;
  blockNumber: string;
  memberType: string;
  isSecretary: boolean;
  status: string;
}

export default function SecretaryEditMemberPage() {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    flatNumber: '',
    blockNumber: '',
    memberType: 'OWNER',
    isSecretary: false,
    status: 'ACTIVE'
  });
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.user.role === 'MEMBER' && data.user.isSecretary) {
        setUser(data.user);
        fetchMemberDetails();
      } else {
        router.push('/member/dashboard');
      }
    } catch {
      router.push('/member/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMemberDetails = async () => {
    try {
      const response = await fetch(`/api/member/secretary/members/${memberId}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setMember(data.member);
        setFormData({
          firstName: data.member.firstName,
          lastName: data.member.lastName,
          email: data.member.email,
          phone: data.member.phone,
          flatNumber: data.member.flatNumber,
          blockNumber: data.member.blockNumber,
          memberType: data.member.memberType,
          isSecretary: data.member.isSecretary,
          status: data.member.status
        });
      } else {
        console.error('Failed to fetch member details:', data.message);
        router.push('/member/secretary/members');
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      router.push('/member/secretary/members');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/member/secretary/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Member updated successfully!');
        router.push(`/member/secretary/members/${memberId}`);
      } else {
        alert('Failed to update member: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Failed to update member');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading member details..." />;
  }

  if (!member) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Member not found</h3>
          <p className="text-gray-500 mt-1">The member you're looking for doesn't exist.</p>
          <Link
            href="/member/secretary/members"
            className="mt-4 inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Back to Members
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/member/secretary/members" className="hover:text-gray-700">
              All Members
            </Link>
            <span>/</span>
            <Link href={`/member/secretary/members/${memberId}`} className="hover:text-gray-700">
              {member.firstName} {member.lastName}
            </Link>
            <span>/</span>
            <span className="text-gray-900">Edit</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Edit Member</h1>
          <p className="text-gray-600 mt-1">Update member information</p>
        </div>
        <Link
          href={`/member/secretary/members/${memberId}`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Member
        </Link>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Member Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Flat Number */}
              <div>
                <label htmlFor="flatNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Flat Number *
                </label>
                <input
                  type="text"
                  id="flatNumber"
                  name="flatNumber"
                  value={formData.flatNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="e.g., 101, A-201"
                />
              </div>

              {/* Block Number */}
              <div>
                <label htmlFor="blockNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Block Number *
                </label>
                <input
                  type="text"
                  id="blockNumber"
                  name="blockNumber"
                  value={formData.blockNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="e.g., A, B, 1, 2"
                />
              </div>

              {/* Member Type */}
              <div>
                <label htmlFor="memberType" className="block text-sm font-medium text-gray-700 mb-2">
                  Member Type *
                </label>
                <select
                  id="memberType"
                  name="memberType"
                  value={formData.memberType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  <option value="OWNER">Owner</option>
                  <option value="TENANT">Tenant</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              {/* Secretary Checkbox */}
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isSecretary"
                    name="isSecretary"
                    checked={formData.isSecretary}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isSecretary" className="ml-2 block text-sm text-gray-700">
                    Make this member a secretary
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Secretaries can manage society members and have additional privileges
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Link
              href={`/member/secretary/members/${memberId}`}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating Member...' : 'Update Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
