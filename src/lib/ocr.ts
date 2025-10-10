import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { GoogleAuth } from 'google-auth-library';

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
  private client: DocumentProcessorServiceClient | null = null;
  private projectId: string;
  private location: string;
  private processorId: string;
  private initializationAttempted: boolean = false;
  private initializationError: Error | null = null;

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'arthyaa';
    this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us';
    this.processorId = process.env.GOOGLE_CLOUD_PROCESSOR_ID || 'your-processor-id';

    console.log('=== OCR Service Constructor Called ===');
    console.log(`  Project ID: ${this.projectId}`);
    console.log(`  Processor ID: ${this.processorId}`);
    console.log('  Note: Client will be initialized on first use (lazy initialization)');
  }

  /**
   * Lazy initialization of Document AI client
   * Called on first actual use, not during module import
   */
  private initializeClient(): void {
    if (this.initializationAttempted) {
      return; // Already tried, don't retry
    }

    this.initializationAttempted = true;

    console.log('\n=== Initializing Document AI Client (Lazy) ===');
    console.log(`Environment check:`);
    console.log(`  GOOGLE_CLOUD_CREDENTIALS: ${process.env.GOOGLE_CLOUD_CREDENTIALS ? 'SET' : 'NOT SET'}`);
    console.log(`  GOOGLE_CLOUD_CLIENT_EMAIL: ${process.env.GOOGLE_CLOUD_CLIENT_EMAIL ? 'SET' : 'NOT SET'}`);
    console.log(`  GOOGLE_CLOUD_PRIVATE_KEY: ${process.env.GOOGLE_CLOUD_PRIVATE_KEY ? 'SET (length: ' + process.env.GOOGLE_CLOUD_PRIVATE_KEY.length + ')' : 'NOT SET'}`);
    console.log(`  Project ID: ${this.projectId}`);
    console.log(`  Processor ID: ${this.processorId}`);

    // Initialize client with proper error handling
    try {
      // Check if we have proper credentials
      if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
        console.log('📝 Using GOOGLE_CLOUD_CREDENTIALS path...');
        const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS, 'base64').toString());
        const auth = new GoogleAuth({
          credentials: credentials
        });
        this.client = new DocumentProcessorServiceClient({
          auth: auth,
          // gRPC client options for OpenSSL 3.x compatibility
          grpc: {
            'grpc.ssl_target_name_override': undefined,
            'grpc.default_authority': undefined,
          } as any
        });
        console.log('✅ Client initialized via GOOGLE_CLOUD_CREDENTIALS');
      } else if (process.env.GOOGLE_CLOUD_CLIENT_EMAIL && process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
        console.log('📝 Using individual environment variables path...');

        // Format private key - handle both escaped (\n) and actual newlines
        let privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
        console.log(`Private key length: ${privateKey.length}`);
        console.log(`Has escaped newlines: ${privateKey.includes('\\n')}`);
        console.log(`Has BEGIN marker: ${privateKey.includes('BEGIN PRIVATE KEY')}`);

        if (privateKey.includes('\\n')) {
          privateKey = privateKey.replace(/\\n/g, '\n');
          console.log('Converted escaped newlines to actual newlines');
        }

        const credentials = {
          type: "service_account",
          project_id: this.projectId,
          private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
          private_key: privateKey,
          client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL,
          universe_domain: "googleapis.com"
        };

        console.log('Initializing Google Cloud Document AI with service account credentials...');
        console.log(`  Project ID: ${this.projectId}`);
        console.log(`  Processor ID: ${this.processorId}`);
        console.log(`  Client Email: ${credentials.client_email}`);

        const auth = new GoogleAuth({
          credentials: credentials
        });

        console.log('Creating DocumentProcessorServiceClient...');
        this.client = new DocumentProcessorServiceClient({
          auth: auth,
          // gRPC client options for OpenSSL 3.x compatibility
          grpc: {
            'grpc.ssl_target_name_override': undefined,
            'grpc.default_authority': undefined,
          } as any
        });

        console.log('✅ Google Cloud Document AI client initialized successfully');
      } else {
        // No credentials available, client will be null
        console.warn('⚠️  No credentials path matched!');
        console.warn(`  GOOGLE_CLOUD_CREDENTIALS: ${!!process.env.GOOGLE_CLOUD_CREDENTIALS}`);
        console.warn(`  GOOGLE_CLOUD_CLIENT_EMAIL: ${!!process.env.GOOGLE_CLOUD_CLIENT_EMAIL}`);
        console.warn(`  GOOGLE_CLOUD_PRIVATE_KEY: ${!!process.env.GOOGLE_CLOUD_PRIVATE_KEY}`);
        this.client = null as any;
        console.warn('❌ Google Cloud credentials not configured, OCR will use fallback mode');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Google Cloud Document AI client:');
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Full error:', error);
      this.client = null;
      this.initializationError = error instanceof Error ? error : new Error(String(error));
    }

    console.log(`=== Initialization Complete: Client ${this.client ? 'INITIALIZED' : 'NULL'} ===\n`);
  }

  async processReceipt(imageBuffer: Buffer): Promise<OcrResult> {
    try {
      // Lazy initialization on first use
      if (!this.initializationAttempted) {
        this.initializeClient();
      }

      // Check if client is available and processor ID is configured
      console.log('OCR Service Status Check:');
      console.log(`  Client initialized: ${!!this.client}`);
      console.log(`  Processor ID: ${this.processorId}`);
      console.log(`  Project ID: ${this.projectId}`);
      console.log(`  Location: ${this.location}`);

      if (this.initializationError) {
        console.warn(`❌ Previous initialization error: ${this.initializationError.message}`);
      }

      if (!this.client || !this.processorId || this.processorId === 'your-processor-id') {
        console.warn('❌ Google Cloud Document AI not configured, using fallback OCR');
        console.warn(`   Reasons: client=${!!this.client}, processorId=${this.processorId}`);
        return this.fallbackOCR(imageBuffer);
      }

      console.log('✅ Proceeding with Google Cloud Document AI processing...');
      const name = `projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}`;
      console.log(`   Resource name: ${name}`);

      const request = {
        name,
        rawDocument: {
          content: imageBuffer,
          mimeType: 'image/jpeg', // or detect from file
        },
      };

      console.log('   Sending request to Document AI...');
      const [result] = await this.client.processDocument(request);
      const { document } = result;

      if (!document) {
        throw new Error('No document returned from OCR service');
      }

      console.log('✅ Document AI processing successful');
      // Extract text from the document
      const rawText = document.text || '';
      console.log(`   Extracted text length: ${rawText.length} characters`);

      // Parse the extracted text to find relevant information
      const extractedData = this.parseReceiptText(rawText);
      const confidence = this.calculateConfidence(extractedData);
      console.log(`   OCR Confidence: ${(confidence * 100).toFixed(1)}%`);

      return {
        ...extractedData,
        rawText,
        confidence
      };
    } catch (error) {
      console.error('❌ OCR processing error:', error);
      console.log('⚠️  Falling back to basic OCR processing');
      return this.fallbackOCR(imageBuffer);
    }
  }

  private fallbackOCR(imageBuffer: Buffer): OcrResult {
    // Fallback OCR that returns basic data
    return {
      blockNumber: '',
      flatNumber: '',
      amount: 0,
      paymentDate: '',
      purpose: '',
      rawText: 'OCR processing not available - manual entry required',
      confidence: 0.1
    };
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
