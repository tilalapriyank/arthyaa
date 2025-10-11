import { uploadToCloudinary } from './cloudinary';

interface ReceiptData {
  id: string;
  blockNumber: string;
  flatNumber: string;
  amount: number;
  paymentDate: string;
  purpose: string;
  paymentMethod: string;
  transactionId?: string;
  upiId?: string;
  member: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  society: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  createdAt: string;
}

export class ReceiptGenerator {
  async generateReceiptPDF(receiptData: ReceiptData): Promise<string> {
    try {
      // Create HTML content for the receipt
      const htmlContent = this.generateReceiptHTML(receiptData);
      
      // Convert HTML to PDF using a service like Puppeteer or similar
      // For now, we'll create a simple HTML receipt and upload it
      const receiptUrl = await this.uploadReceiptHTML(htmlContent, receiptData.id);
      
      return receiptUrl;
    } catch (error) {
      console.error('Error generating receipt PDF:', error);
      throw new Error('Failed to generate receipt PDF');
    }
  }

  private generateReceiptHTML(data: ReceiptData): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt - ${data.society.name}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .receipt-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            padding: 30px;
          }
          .receipt-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-section h3 {
            color: #374151;
            margin: 0 0 15px 0;
            font-size: 18px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
          }
          .info-value {
            color: #111827;
            font-weight: 500;
          }
          .amount-section {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .amount-label {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .amount-value {
            color: #059669;
            font-size: 32px;
            font-weight: bold;
          }
          .footer {
            background: #f9fafb;
            padding: 20px 30px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .receipt-id {
            background: #e5e7eb;
            padding: 10px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 14px;
            margin-top: 15px;
          }
          .status-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1>${data.society.name}</h1>
            <p>${data.society.address || ''} ${data.society.city || ''} ${data.society.state || ''} ${data.society.pincode || ''}</p>
          </div>
          
          <div class="content">
            <div class="receipt-info">
              <div class="info-section">
                <h3>Payment Details</h3>
                <div class="info-item">
                  <span class="info-label">Receipt ID:</span>
                  <span class="info-value">#${data.id.slice(-8).toUpperCase()}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Payment Date:</span>
                  <span class="info-value">${formatDate(data.paymentDate)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Payment Method:</span>
                  <span class="info-value">${data.paymentMethod.replace('_', ' ')}</span>
                </div>
                ${data.transactionId ? `
                <div class="info-item">
                  <span class="info-label">Transaction ID:</span>
                  <span class="info-value">${data.transactionId}</span>
                </div>
                ` : ''}
                ${data.upiId ? `
                <div class="info-item">
                  <span class="info-label">UPI ID:</span>
                  <span class="info-value">${data.upiId}</span>
                </div>
                ` : ''}
              </div>
              
              <div class="info-section">
                <h3>Member Details</h3>
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${data.member.firstName} ${data.member.lastName}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${data.member.email}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Block:</span>
                  <span class="info-value">${data.blockNumber}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Flat:</span>
                  <span class="info-value">${data.flatNumber}</span>
                </div>
              </div>
            </div>
            
            <div class="amount-section">
              <div class="amount-label">Amount Paid</div>
              <div class="amount-value">${formatCurrency(data.amount)}</div>
              <div style="margin-top: 10px;">
                <span class="status-badge">Approved</span>
              </div>
            </div>
            
            <div class="info-item">
              <span class="info-label">Purpose:</span>
              <span class="info-value">${data.purpose}</span>
            </div>
            
            <div class="receipt-id">
              Receipt Generated on: ${formatDate(data.createdAt)}
            </div>
          </div>
          
          <div class="footer">
            <p>This is a computer-generated receipt. No signature required.</p>
            <p>For any queries, please contact the society management.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async uploadReceiptHTML(htmlContent: string, receiptId: string): Promise<string> {
    try {
      // Convert HTML to buffer
      const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
      
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(htmlBuffer, {
        folder: 'receipts',
        resource_type: 'raw',
        public_id: `receipt-${receiptId}`,
        format: 'html'
      });

      if (uploadResult.success) {
        return uploadResult.secure_url!;
      } else {
        throw new Error('Failed to upload receipt');
      }
    } catch (error) {
      console.error('Error uploading receipt HTML:', error);
      throw error;
    }
  }
}

export const receiptGenerator = new ReceiptGenerator();
