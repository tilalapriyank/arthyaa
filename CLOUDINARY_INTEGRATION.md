# Cloudinary Integration for Arthyaa

This document describes the Cloudinary integration implemented for file uploads in the Arthyaa application.

## Overview

The application now uses Cloudinary for handling image, PDF, and document uploads instead of local file storage. This provides better scalability, CDN delivery, and image optimization.

## Configuration

### Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="do2vrkwcw"
CLOUDINARY_API_KEY="623555129445498"
CLOUDINARY_API_SECRET="luLjW3M-meeJk4uCBaUGfI6C2YY"
```

### Cloudinary Account Details

- **Cloud Name**: do2vrkwcw
- **API Key**: 623555129445498
- **API Secret**: luLjW3M-meeJk4uCBaUGfI6C2YY

## Features Implemented

### 1. Core Upload Functionality

- **File Types Supported**: Images (JPEG, PNG, GIF, WebP, SVG), PDFs, Documents (DOC, DOCX, XLS, XLSX, TXT, CSV)
- **File Size Limits**: 
  - Images: 5MB max
  - Documents: 20MB max
  - General: 10MB max
- **Automatic Optimization**: Images are automatically optimized for web delivery
- **CDN Delivery**: All files are served through Cloudinary's global CDN

### 2. API Endpoints

#### General Upload
- **Endpoint**: `/api/upload`
- **Method**: POST
- **Body**: FormData with `file`, `folder`, `category`
- **Response**: `{ success: boolean, public_id: string, secure_url: string }`

#### Image Upload with Transformations
- **Endpoint**: `/api/upload/image`
- **Method**: POST
- **Body**: FormData with `file`, `folder`, `width`, `height`, `quality`, `format`
- **Response**: Optimized image URL with transformations

#### Document Upload
- **Endpoint**: `/api/upload/document`
- **Method**: POST
- **Body**: FormData with `file`, `folder`, `category`
- **Response**: Document URL for download

#### File Deletion
- **Endpoint**: `/api/upload`
- **Method**: DELETE
- **Query**: `public_id`, `resource_type`
- **Response**: `{ success: boolean }`

### 3. React Components

#### ImageUpload Component
```tsx
import ImageUpload from '@/components/ImageUpload';

<ImageUpload
  onImageUpload={(file) => console.log('Uploaded:', file)}
  onImageRemove={() => console.log('Removed')}
  folder="arthyaa/societies"
  width={300}
  height={120}
  quality="auto"
  format="webp"
  preview={true}
/>
```

#### FileUpload Component
```tsx
import FileUpload from '@/components/FileUpload';

<FileUpload
  onUpload={async (file) => {
    // Handle file upload
  }}
  category="document"
  maxSize={10}
  folder="arthyaa/documents"
/>
```

### 4. Society Logo Upload

The society creation form now uses Cloudinary for logo uploads:

- **Folder**: `arthyaa/societies`
- **Transformations**: 300x120px, WebP format, auto quality
- **Preview**: Real-time preview with remove functionality
- **Validation**: Image type validation, size limits

## File Organization

### Cloudinary Folder Structure

```
arthyaa/
├── societies/          # Society logos
├── images/            # General images
├── documents/         # PDFs and documents
└── members/           # Member profile images
```

## Usage Examples

### 1. Upload Society Logo

```tsx
const handleLogoUpload = (file: UploadedFile) => {
  setUploadedLogo(file);
  setFormData(prev => ({
    ...prev,
    logo: file.secure_url
  }));
};
```

### 2. Upload Document

```tsx
const handleDocumentUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'arthyaa/documents');
  formData.append('category', 'document');

  const response = await fetch('/api/upload/document', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (result.success) {
    console.log('Document uploaded:', result.secure_url);
  }
};
```

### 3. Delete File

```tsx
const deleteFile = async (publicId: string) => {
  const response = await fetch(`/api/upload?public_id=${publicId}&resource_type=image`, {
    method: 'DELETE',
  });

  const result = await response.json();
  if (result.success) {
    console.log('File deleted successfully');
  }
};
```

## Image Transformations

Cloudinary provides automatic image optimization:

- **Format**: Automatic format selection (WebP, AVIF when supported)
- **Quality**: Auto quality optimization
- **Responsive**: Automatic responsive image generation
- **Lazy Loading**: Built-in lazy loading support

### Custom Transformations

```tsx
// Resize and optimize image
const optimizedUrl = getOptimizedImageUrl(publicId, {
  width: 300,
  height: 200,
  crop: 'fill',
  gravity: 'auto',
  quality: 'auto',
  format: 'webp'
});
```

## Security Features

- **File Type Validation**: Only allowed file types can be uploaded
- **Size Limits**: Prevents oversized file uploads
- **Access Control**: Files are organized by folders for better access control
- **Secure URLs**: All URLs use HTTPS

## Error Handling

The integration includes comprehensive error handling:

- **Upload Failures**: Graceful handling of upload errors
- **Validation Errors**: Clear error messages for invalid files
- **Network Issues**: Retry mechanisms for network failures
- **User Feedback**: Real-time upload progress and status

## Testing

### Test Cloudinary Configuration

Visit `/api/test-cloudinary` to verify your Cloudinary configuration is working correctly.

### Test File Upload

1. Go to `/admin/societies/add`
2. Try uploading a society logo
3. Verify the image appears in the preview
4. Submit the form to test the complete flow

## Migration from Local Storage

The application has been updated to use Cloudinary instead of local file storage:

- **Old**: Files stored in `public/uploads/`
- **New**: Files stored in Cloudinary with CDN delivery
- **Benefits**: Better performance, scalability, and image optimization

## Troubleshooting

### Common Issues

1. **Environment Variables**: Ensure all Cloudinary environment variables are set
2. **File Size**: Check file size limits (5MB for images, 20MB for documents)
3. **File Type**: Verify file type is supported
4. **Network**: Check internet connection for uploads

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed upload logs.

## Future Enhancements

- **Video Upload**: Support for video file uploads
- **Batch Upload**: Multiple file upload functionality
- **Advanced Transformations**: More image transformation options
- **Analytics**: Upload and usage analytics
- **Backup**: Automatic backup to secondary storage

## Support

For issues related to Cloudinary integration:

1. Check the console for error messages
2. Verify environment variables are set correctly
3. Test the `/api/test-cloudinary` endpoint
4. Check Cloudinary dashboard for upload logs
