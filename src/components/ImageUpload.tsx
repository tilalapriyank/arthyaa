'use client';

import React, { useState, useCallback } from 'react';
import { PhotoIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import FileUpload, { UploadedFile } from './FileUpload';

export interface ImageUploadProps {
  onImageUpload: (file: UploadedFile) => void;
  onImageRemove?: () => void;
  folder?: string;
  width?: number;
  height?: number;
  quality?: string;
  format?: string;
  className?: string;
  disabled?: boolean;
  preview?: boolean;
}

export default function ImageUpload({
  onImageUpload,
  onImageRemove,
  folder = 'arthyaa/images',
  width,
  height,
  quality = 'auto',
  format,
  className = '',
  disabled = false,
  preview = true,
}: ImageUploadProps) {
  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Validate file before upload
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      
      if (width) formData.append('width', width.toString());
      if (height) formData.append('height', height.toString());
      if (quality) formData.append('quality', quality);
      if (format) formData.append('format', format);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Validate the response has required fields
      if (!result.secure_url || !result.public_id) {
        throw new Error('Invalid response from server');
      }

      const uploadedFile: UploadedFile = {
        id: result.public_id,
        name: result.file_name || file.name,
        size: result.file_size || file.size,
        type: result.file_type || file.type,
        url: result.secure_url,
        public_id: result.public_id,
      };

      setUploadedImage(uploadedFile);
      onImageUpload(uploadedFile);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [folder, width, height, quality, format, onImageUpload]);

  const handleRemove = useCallback(async () => {
    if (!uploadedImage) return;

    try {
      const response = await fetch(`/api/upload?public_id=${uploadedImage.public_id}&resource_type=image`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.warn('Failed to delete image from Cloudinary');
      }
    } catch (error) {
      console.warn('Error deleting image:', error);
    }

    setUploadedImage(null);
    setPreviewUrl(null);
    onImageRemove?.();
  }, [uploadedImage, onImageRemove]);

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!uploadedImage ? (
        <div className="space-y-4">
          <FileUpload
            onUpload={(file) => {
              // Create preview URL
              const url = URL.createObjectURL(file);
              setPreviewUrl(url);
              handleUpload(file);
            }}
            category="image"
            folder={folder}
            maxSize={5}
            className="min-h-[200px]"
            disabled={disabled || isUploading}
          />
          
          {previewUrl && !isUploading && (
            <div className="flex items-center space-x-4">
              {/* Small Preview */}
              <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm flex-shrink-0">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Preview Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Logo Preview
                </p>
                <p className="text-xs text-gray-500">
                  Ready to upload
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {preview && (
            <div className="flex items-center space-x-4">
              {/* Small Preview */}
              <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm flex-shrink-0">
                <img
                  src={uploadedImage.url}
                  alt={uploadedImage.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error('Image failed to load:', uploadedImage.url);
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full flex items-center justify-center text-gray-500 bg-gray-50">
                  <PhotoIcon className="w-6 h-6" />
                </div>
              </div>
              
              {/* Image Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedImage.name}
                </p>
                <p className="text-xs text-gray-500">
                  Society Logo • {formatFileSize(uploadedImage.size)}
                </p>
              </div>
            </div>
          )}
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-green-700 font-medium">
                  Logo uploaded successfully
                </span>
              </div>
              <button
                onClick={handleRemove}
                disabled={disabled}
                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-all duration-200"
                title="Remove logo"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {isUploading && (
        <div className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded p-3">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Uploading image...</span>
          </div>
        </div>
      )}
    </div>
  );
}
