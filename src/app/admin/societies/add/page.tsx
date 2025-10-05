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
    adminEmail: '',
    logo: ''
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const router = useRouter();

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    return data;
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      const parsedData = parseCSV(csvText);
      
      // Validate CSV structure
      if (parsedData.length === 0) {
        setError('CSV file is empty or invalid format');
        return;
      }
      
      const firstRow = parsedData[0];
      const requiredColumns = ['block', 'flat', 'floor'];
      const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));
      
      if (missingColumns.length > 0) {
        setError(`Missing required columns: ${missingColumns.join(', ')}`);
        return;
      }
      
      setCsvData(parsedData);
      setCsvPreview(parsedData); // Store all data for preview
      setError('');
    };
    reader.readAsText(file);
  };

  const handleEditRow = (index: number) => {
    setEditingRow(index);
    setEditData({ ...csvPreview[index] });
  };

  const handleSaveEdit = () => {
    if (editingRow !== null) {
      const updatedData = [...csvPreview];
      updatedData[editingRow] = { ...editData };
      setCsvPreview(updatedData);
      setCsvData(updatedData);
      setEditingRow(null);
      setEditData({});
    }
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditData({});
  };

  const handleDeleteRow = (index: number) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      const updatedData = csvPreview.filter((_, i) => i !== index);
      setCsvPreview(updatedData);
      setCsvData(updatedData);
    }
  };

  const handleEditChange = (field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
      formDataToSend.append('adminEmail', formData.adminEmail);
      formDataToSend.append('csvData', JSON.stringify(csvData));
      
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
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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
    const requiredFields = ['name', 'adminEmail', 'mobile', 'address', 'city', 'state', 'pincode', 'logo'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) errors[field] = error;
    });
    
    // Validate CSV data
    if (!csvFile || csvData.length === 0) {
      errors.csvFile = 'CSV file with structure data is required';
    }
    
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

                {/* CSV Upload Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Structure Details (CSV Upload)</h3>
                  <div className="space-y-6">
                    {/* CSV Upload */}
                    <div>
                      <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-2">
                        Upload CSV File*
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                        <div className="space-y-1 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="csvFile"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                              <span>Upload a CSV file</span>
                              <input
                                id="csvFile"
                                name="csvFile"
                                type="file"
                                accept=".csv"
                                onChange={handleCSVUpload}
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">CSV files only</p>
                        </div>
                      </div>
                      {csvFile && (
                        <p className="mt-2 text-sm text-green-600">
                          ✓ {csvFile.name} uploaded successfully
                        </p>
                      )}
                    </div>

                    {/* CSV Format Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">CSV Format Requirements:</h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>• Required columns: <code className="bg-blue-100 px-1 rounded">block</code>, <code className="bg-blue-100 px-1 rounded">flat</code>, <code className="bg-blue-100 px-1 rounded">floor</code></p>
                        <p>• Example format:</p>
                        <div className="bg-white border rounded p-2 mt-2 font-mono text-xs">
                          block,flat,floor<br/>
                          A,101,1<br/>
                          A,102,1<br/>
                          A,201,2<br/>
                          B,101,1
                        </div>
                      </div>
                    </div>

                    {/* CSV Preview Button */}
                    {csvPreview.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700">CSV Data Loaded</h4>
                            <p className="text-xs text-gray-500">Total records: {csvData.length}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPreviewModal(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview Data
                          </button>
                        </div>
                      </div>
                    )}
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

      {/* CSV Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">CSV Data Preview</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4 text-sm text-gray-600">
                Showing all {csvPreview.length} records from your CSV file
                {csvPreview.length === 0 && (
                  <span className="text-red-600 ml-2">⚠️ No records remaining</span>
                )}
              </div>
              
              <div className="max-h-96 overflow-auto border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {csvPreview.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {editingRow === index ? (
                            <input
                              type="text"
                              value={editData.block || ''}
                              onChange={(e) => handleEditChange('block', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            row.block
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {editingRow === index ? (
                            <input
                              type="text"
                              value={editData.flat || ''}
                              onChange={(e) => handleEditChange('flat', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            row.flat
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {editingRow === index ? (
                            <input
                              type="number"
                              value={editData.floor || ''}
                              onChange={(e) => handleEditChange('floor', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            row.floor
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {editingRow === index ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={handleSaveEdit}
                                className="text-green-600 hover:text-green-800"
                                title="Save"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-800"
                                title="Cancel"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditRow(index)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteRow(index)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}