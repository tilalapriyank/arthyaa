'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AddSocietyPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    mobile: '',
    city: '',
    state: '',
    pincode: '',
    blocks: '',
    floorsPerBlock: '',
    flatsPerFloor: '',
    totalFlats: '',
    adminEmail: '',
    logo: ''
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const router = useRouter();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      setError('Please fix the errors below before submitting.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('pincode', formData.pincode);
      formDataToSend.append('mobile', formData.mobile);
      formDataToSend.append('blocks', formData.blocks);
      formDataToSend.append('floorsPerBlock', formData.floorsPerBlock);
      formDataToSend.append('flatsPerFloor', formData.flatsPerFloor);
      formDataToSend.append('totalFlats', formData.totalFlats);
      formDataToSend.append('adminEmail', formData.adminEmail);
      
      // Add logo file if selected
      const logoInput = document.getElementById('logo') as HTMLInputElement;
      if (logoInput && logoInput.files && logoInput.files[0]) {
        formDataToSend.append('logo', logoInput.files[0]);
      }
      
      const response = await fetch('/api/admin/societies', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Society created successfully! Welcome email with login credentials sent to the society admin.');
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 3000);
      } else {
        setError(data.message || 'Failed to create society');
      }
    } catch (error) {
      console.error('Error creating society:', error);
      setError('Failed to create society. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Society name is required';
        if (value.trim().length < 3) return 'Society name must be at least 3 characters';
        return '';
      case 'mobile':
        if (!value.trim()) return 'Phone number is required';
        if (!/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/\s/g, ''))) return 'Please enter a valid mobile number';
        return '';
      case 'pincode':
        if (value && !/^\d{6}$/.test(value)) return 'Pincode must be 6 digits';
        return '';
      case 'blocks':
        if (!value.trim()) return 'Number of blocks is required';
        if (isNaN(Number(value)) || Number(value) < 1) return 'Number of blocks must be a positive number';
        return '';
      case 'floorsPerBlock':
        if (!value.trim()) return 'Floors per block is required';
        if (isNaN(Number(value)) || Number(value) < 1) return 'Floors per block must be a positive number';
        return '';
      case 'flatsPerFloor':
        if (!value.trim()) return 'Flats per floor is required';
        if (isNaN(Number(value)) || Number(value) < 1) return 'Flats per floor must be a positive number';
        return '';
      case 'adminEmail':
        if (!value.trim()) return 'Admin email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'address':
        if (!value.trim()) return 'Address is required';
        if (value.trim().length < 10) return 'Address must be at least 10 characters';
        return '';
      case 'city':
        if (!value.trim()) return 'City is required';
        return '';
      case 'state':
        if (!value.trim()) return 'State is required';
        return '';
      case 'pincode':
        if (!value.trim()) return 'Pincode is required';
        if (!/^\d{6}$/.test(value)) return 'Pincode must be 6 digits';
        return '';
      case 'logo':
        if (!value.trim()) return 'Society logo is required';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    
    // Handle file upload for logo
    if (name === 'logo' && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Calculate total flats automatically
      if (name === 'blocks' || name === 'floorsPerBlock' || name === 'flatsPerFloor') {
        const blocks = name === 'blocks' ? Number(value) : Number(prev.blocks);
        const floorsPerBlock = name === 'floorsPerBlock' ? Number(value) : Number(prev.floorsPerBlock);
        const flatsPerFloor = name === 'flatsPerFloor' ? Number(value) : Number(prev.flatsPerFloor);
        
        if (blocks > 0 && floorsPerBlock > 0 && flatsPerFloor > 0) {
          newData.totalFlats = (blocks * floorsPerBlock * flatsPerFloor).toString();
        }
      }
      
      return newData;
    });
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Validate all fields as required
    const requiredFields = ['name', 'adminEmail', 'mobile', 'address', 'city', 'state', 'pincode', 'blocks', 'floorsPerBlock', 'flatsPerFloor', 'logo'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) errors[field] = error;
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="w-full">
        <div className="w-full">
          {/* Form Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-6 pt-0 ps-0">
            <h1 className="text-2xl font-bold text-gray-900">Add Society</h1>
            <p className="text-gray-600 mt-1">Create a new society profile for your directory</p>
          </div>
          
          {/* Form Content */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Society Details Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Society Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Society Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Society Name*
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.name ? 'border-red-300' : ''
                        }`}
                        placeholder="Enter society name"
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                      )}
                    </div>

                    {/* Admin Email */}
                    <div>
                      <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="adminEmail"
                        name="adminEmail"
                        required
                        value={formData.adminEmail}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.adminEmail ? 'border-red-300' : ''
                        }`}
                        placeholder="Enter email address"
                      />
                      {formErrors.adminEmail && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.adminEmail}</p>
                      )}
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number*
                      </label>
                      <div className="flex">
                        <div className="flex items-center px-3 py-2 border border-gray-300 border-r-0 rounded-l-md bg-gray-50">
                          <span className="text-sm text-gray-500">+91</span>
                        </div>
                        <input
                          type="tel"
                          id="mobile"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.mobile ? 'border-red-300' : ''
                          }`}
                          placeholder="Enter phone number"
                        />
                      </div>
                      {formErrors.mobile && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.mobile}</p>
                      )}
                    </div>

                    {/* Society Logo */}
                    <div>
                      <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
                        Society Logo*
                      </label>
                      <div className="space-y-3">
                        <input
                          type="file"
                          id="logo"
                          name="logo"
                          required
                          accept="image/*"
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.logo ? 'border-red-300' : ''
                          }`}
                        />
                        {formErrors.logo && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.logo}</p>
                        )}
                        {logoPreview && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-2">Preview:</p>
                            <div className="border border-gray-200 rounded-md p-2 bg-gray-50">
                              <Image
                                src={logoPreview}
                                alt="Logo preview"
                                width={200}
                                height={80}
                                className="max-w-full h-20 object-contain mx-auto"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address & Location Details Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address & Location Details</h3>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Address */}
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                        Address*
                      </label>
                      <textarea
                        id="address"
                        name="address"
                        rows={2}
                        value={formData.address}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.address ? 'border-red-300' : ''
                        }`}
                        placeholder="Enter society address"
                      />
                      {formErrors.address && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Location Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        City*
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.city ? 'border-red-300' : ''
                        }`}
                        placeholder="Enter city name"
                      />
                      {formErrors.city && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                        State*
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.state ? 'border-red-300' : ''
                        }`}
                        placeholder="Enter state name"
                      />
                      {formErrors.state && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.state}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">
                        Pincode*
                      </label>
                      <input
                        type="text"
                        id="pincode"
                        name="pincode"
                        required
                        value={formData.pincode}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.pincode ? 'border-red-300' : ''
                        }`}
                        placeholder="Enter 6-digit pincode"
                      />
                      {formErrors.pincode && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.pincode}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Structure Details Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Structure Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Number of Blocks */}
                    <div>
                      <label htmlFor="blocks" className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Blocks*
                      </label>
                      <input
                        type="number"
                        id="blocks"
                        name="blocks"
                        required
                        value={formData.blocks}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.blocks ? 'border-red-300' : ''
                        }`}
                        placeholder="e.g., 3"
                      />
                      {formErrors.blocks && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.blocks}</p>
                      )}
                    </div>

                    {/* Floors per Block */}
                    <div>
                      <label htmlFor="floorsPerBlock" className="block text-sm font-medium text-gray-700 mb-2">
                        Floors per Block*
                      </label>
                      <input
                        type="number"
                        id="floorsPerBlock"
                        name="floorsPerBlock"
                        required
                        value={formData.floorsPerBlock}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.floorsPerBlock ? 'border-red-300' : ''
                        }`}
                        placeholder="e.g., 10"
                      />
                      {formErrors.floorsPerBlock && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.floorsPerBlock}</p>
                      )}
                    </div>

                    {/* Flats per Floor */}
                    <div>
                      <label htmlFor="flatsPerFloor" className="block text-sm font-medium text-gray-700 mb-2">
                        Flats per Floor*
                      </label>
                      <input
                        type="number"
                        id="flatsPerFloor"
                        name="flatsPerFloor"
                        required
                        value={formData.flatsPerFloor}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.flatsPerFloor ? 'border-red-300' : ''
                        }`}
                        placeholder="e.g., 4"
                      />
                      {formErrors.flatsPerFloor && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.flatsPerFloor}</p>
                      )}
                    </div>

                    {/* Total Flats (Auto-calculated) */}
                    <div>
                      <label htmlFor="totalFlats" className="block text-sm font-medium text-gray-700 mb-2">
                        Total Flats
                      </label>
                      <input
                        type="number"
                        id="totalFlats"
                        name="totalFlats"
                        value={formData.totalFlats}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600"
                        placeholder="Auto-calculated"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Calculated: Blocks × Floors × Flats per Floor
                      </p>
                    </div>
                  </div>
                </div>


                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{success}</span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/dashboard')}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 h-10 px-4 py-2"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
                  >
                    {isLoading ? 'Creating Society...' : 'Save Society'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}