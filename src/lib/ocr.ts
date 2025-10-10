import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

interface OcrResult {
  blockNumber?: string;
  flatNumber?: string;
  amount?: number;
  paymentDate?: string;
  purpose?: string;
  confidence: number;
  rawText: string;
}

export class OCRService {
  private client: DocumentProcessorServiceClient;
  private projectId: string;
  private location: string;
  private processorId: string;

  constructor() {
    // Get credentials from environment variables
    const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS 
      ? JSON.parse(Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS, 'base64').toString())
      : {
          type: "service_account",
          project_id: process.env.GOOGLE_CLOUD_PROJECT_ID || "arthyaa",
          private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL,
          universe_domain: "googleapis.com"
        };

    this.client = new DocumentProcessorServiceClient({
      credentials
    });
    
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'arthyaa';
    this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us';
    this.processorId = process.env.GOOGLE_CLOUD_PROCESSOR_ID || 'your-processor-id';
  }

  async processReceipt(imageBuffer: Buffer): Promise<OcrResult> {
    try {
      const name = `projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}`;
      
      const request = {
        name,
        rawDocument: {
          content: imageBuffer,
          mimeType: 'image/jpeg', // or detect from file
        },
      };

      const [result] = await this.client.processDocument(request);
      const { document } = result;

      if (!document) {
        throw new Error('No document returned from OCR service');
      }

      // Extract text from the document
      const rawText = document.text || '';
      
      // Parse the extracted text to find relevant information
      const extractedData = this.parseReceiptText(rawText);
      
      return {
        ...extractedData,
        rawText,
        confidence: this.calculateConfidence(extractedData)
      };
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to process document with OCR');
    }
  }

  private parseReceiptText(text: string): Partial<OcrResult> {
    const result: Partial<OcrResult> = {};

    // Extract amount (look for currency patterns)
    const amountRegex = /(?:₹|Rs\.?|INR)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i;
    const amountMatch = text.match(amountRegex);
    if (amountMatch) {
      result.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    // Extract block number (look for "Block" or "Blk" followed by number)
    const blockRegex = /(?:Block|Blk)[\s:]*(\d+)/i;
    const blockMatch = text.match(blockRegex);
    if (blockMatch) {
      result.blockNumber = blockMatch[1];
    }

    // Extract flat number (look for "Flat" or "Unit" followed by number)
    const flatRegex = /(?:Flat|Unit|Apt)[\s:]*(\d+)/i;
    const flatMatch = text.match(flatRegex);
    if (flatMatch) {
      result.flatNumber = flatMatch[1];
    }

    // Extract date (look for various date formats)
    const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      result.paymentDate = this.formatDate(dateMatch[1]);
    }

    // Extract purpose (look for keywords like maintenance, water, electricity)
    const purposeKeywords = ['maintenance', 'water', 'electricity', 'parking', 'security', 'garbage'];
    for (const keyword of purposeKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        result.purpose = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        break;
      }
    }

    return result;
  }

  private formatDate(dateString: string): string {
    try {
      // Handle different date formats
      const formats = [
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/, // DD/MM/YYYY or DD-MM-YYYY
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})/, // DD/MM/YY or DD-MM-YY
      ];

      for (const format of formats) {
        const match = dateString.match(format);
        if (match) {
          let [, day, month, year] = match;
          if (year.length === 2) {
            year = '20' + year;
          }
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }

      return dateString;
    } catch (error) {
      return dateString;
    }
  }

  private calculateConfidence(data: Partial<OcrResult>): number {
    let confidence = 0;
    let totalFields = 0;

    if (data.amount !== undefined) {
      confidence += 0.3;
      totalFields++;
    }
    if (data.blockNumber) {
      confidence += 0.2;
      totalFields++;
    }
    if (data.flatNumber) {
      confidence += 0.2;
      totalFields++;
    }
    if (data.paymentDate) {
      confidence += 0.15;
      totalFields++;
    }
    if (data.purpose) {
      confidence += 0.15;
      totalFields++;
    }

    return totalFields > 0 ? confidence / totalFields : 0;
  }

  async compareWithManualEntry(ocrData: OcrResult, manualData: any): Promise<number> {
    let matchScore = 0;
    let totalComparisons = 0;

    // Compare amount
    if (ocrData.amount && manualData.amount) {
      const amountDiff = Math.abs(ocrData.amount - parseFloat(manualData.amount));
      const amountMatch = amountDiff < 0.01; // Allow for small floating point differences
      matchScore += amountMatch ? 1 : 0;
      totalComparisons++;
    }

    // Compare block number
    if (ocrData.blockNumber && manualData.blockNumber) {
      const blockMatch = ocrData.blockNumber === manualData.blockNumber;
      matchScore += blockMatch ? 1 : 0;
      totalComparisons++;
    }

    // Compare flat number
    if (ocrData.flatNumber && manualData.flatNumber) {
      const flatMatch = ocrData.flatNumber === manualData.flatNumber;
      matchScore += flatMatch ? 1 : 0;
      totalComparisons++;
    }

    // Compare purpose
    if (ocrData.purpose && manualData.purpose) {
      const purposeMatch = ocrData.purpose.toLowerCase() === manualData.purpose.toLowerCase();
      matchScore += purposeMatch ? 1 : 0;
      totalComparisons++;
    }

    return totalComparisons > 0 ? matchScore / totalComparisons : 0;
  }

  shouldApproveReceipt(ocrMatchScore: number, ocrConfidence: number): boolean {
    // Approve if OCR match score is 85% or higher
    return ocrMatchScore >= 0.85;
  }
}

export const ocrService = new OCRService();
