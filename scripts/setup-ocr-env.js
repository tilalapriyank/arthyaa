const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Google Cloud Document AI Environment Variables\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📄 Creating .env file from env.example...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!\n');
  } else {
    console.log('❌ env.example file not found. Please create it first.\n');
    process.exit(1);
  }
} else {
  console.log('📄 .env file already exists.\n');
}

console.log('🔑 Google Cloud Document AI Setup Instructions:\n');

console.log('1. 📋 Create a Document AI Processor:');
console.log('   - Go to: https://console.cloud.google.com/');
console.log('   - Navigate to: Document AI → Processors');
console.log('   - Click "Create Processor"');
console.log('   - Choose "Form Parser" or "Document OCR"');
console.log('   - Select your region (e.g., us, eu, asia1)');
console.log('   - Copy the Processor ID\n');

console.log('2. 🔐 Set up Service Account Credentials:');
console.log('   - Go to: IAM & Admin → Service Accounts');
console.log('   - Create or select your service account');
console.log('   - Download the JSON key file');
console.log('   - Convert to base64: cat service-account.json | base64\n');

console.log('3. 📝 Update your .env file with:');
console.log('   GOOGLE_CLOUD_PROJECT_ID=your-project-id');
console.log('   GOOGLE_CLOUD_LOCATION=your-region');
console.log('   GOOGLE_CLOUD_PROCESSOR_ID=your-processor-id');
console.log('   GOOGLE_CLOUD_CREDENTIALS=your-base64-encoded-json\n');

console.log('4. 🚀 Test the setup:');
console.log('   - Run: npm run dev');
console.log('   - Try uploading a receipt');
console.log('   - Check the console for OCR processing logs\n');

console.log('📚 For more help, check the documentation:');
console.log('   - Google Cloud Document AI: https://cloud.google.com/document-ai');
console.log('   - Next.js Environment Variables: https://nextjs.org/docs/basic-features/environment-variables\n');

console.log('✨ Setup complete! Remember to restart your development server after updating .env');
