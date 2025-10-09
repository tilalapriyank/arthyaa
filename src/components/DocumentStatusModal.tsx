'use client';

import { useState } from 'react';

interface DocumentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    memberType: string;
    agreementDocumentStatus?: string;
    policyVerificationDocumentStatus?: string;
  } | null;
  onStatusUpdate: (memberId: string, documentType: string, status: string, comments?: string) => Promise<void>;
}

export default function DocumentStatusModal({ 
  isOpen, 
  onClose, 
  member, 
  onStatusUpdate 
}: DocumentStatusModalProps) {
  const [selectedDocument, setSelectedDocument] = useState<'agreement' | 'policyVerification'>('agreement');
  const [status, setStatus] = useState('PENDING');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onStatusUpdate(member.id, selectedDocument, status, comments);
      onClose();
      setComments('');
    } catch (error) {
      console.error('Error updating document status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Update Document Status
          </h3>
          <p className="text-sm text-gray-600">
            {member.firstName} {member.lastName} - {member.memberType}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            {/* Document Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={selectedDocument}
                onChange={(e) => setSelectedDocument(e.target.value as 'agreement' | 'policyVerification')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="agreement">Rent Agreement</option>
                <option value="policyVerification">Policy Verification</option>
              </select>
            </div>

            {/* Current Status Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Status
              </label>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${getStatusColor(
                  selectedDocument === 'agreement' 
                    ? member.agreementDocumentStatus || 'PENDING'
                    : member.policyVerificationDocumentStatus || 'NOT UPLOADED'
                )}`}>
                  {selectedDocument === 'agreement' 
                    ? member.agreementDocumentStatus || 'PENDING'
                    : member.policyVerificationDocumentStatus || 'NOT UPLOADED'
                  }
                </span>
              </div>
            </div>

            {/* New Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any comments about the document review..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

