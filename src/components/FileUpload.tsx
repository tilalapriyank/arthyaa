'use client';

import React, { useState, useRef, useCallback } from 'react';
import { CloudArrowUpIcon, XMarkIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';

export interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  category?: 'image' | 'document' | 'pdf' | 'all';
  folder?: string;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  public_id: string;
}

export default function FileUpload({
  onUpload,
  onRemove,
  accept,
  maxSize = 10,
  category = 'all',
  className = '',
  disabled = false,
  multiple = false,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptedTypes = () => {
    if (accept) return accept;
    
    const types = {
      image: 'image/*',
      document: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv',
      pdf: '.pdf',
      all: '*',
    };
    
    return types[category];
  };

  const getAllowedTypes = () => {
    const types = {
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
      ],
      pdf: ['application/pdf'],
      all: ['*']
    };
    
    return types[category];
  };


  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file inside the callback
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      setError(`File size too large. Maximum size: ${maxSize}MB`);
      return;
    }

    if (category === 'image' && !file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    if (category === 'pdf' && file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    if (category === 'document') {
      const allowedTypes = getAllowedTypes();
      if (!allowedTypes.includes(file.type)) {
        setError(`Please select a valid file type. Allowed types: ${allowedTypes.join(', ')}`);
        return;
      }
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onUpload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset after a short delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onUpload, maxSize, category]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [disabled, handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const getIcon = () => {
    if (category === 'image') return <PhotoIcon className="w-8 h-8" />;
    if (category === 'document' || category === 'pdf') return <DocumentIcon className="w-8 h-8" />;
    return <CloudArrowUpIcon className="w-8 h-8" />;
  };

  const getCategoryText = () => {
    const texts = {
      image: 'images',
      document: 'documents',
      pdf: 'PDF files',
      all: 'files',
    };
    return texts[category];
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedTypes()}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center space-y-2">
          {getIcon()}
          
          {isUploading ? (
            <div className="w-full">
              <div className="text-sm text-gray-600 mb-2">Uploading...</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </div>
              <div className="text-xs text-gray-500">
                {getCategoryText().toUpperCase()} up to {maxSize}MB
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {onRemove && (
        <button
          onClick={onRemove}
          className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
        >
          <XMarkIcon className="w-4 h-4" />
          <span>Remove file</span>
        </button>
      )}
    </div>
  );
}

