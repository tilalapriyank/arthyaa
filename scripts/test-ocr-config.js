/**
 * OCR Configuration Test Script
 * Tests Google Cloud Document AI environment variable loading
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

console.log('=== Google Cloud Document AI Configuration Test ===\n');

// Check all required environment variables
const requiredVars = [
  'GOOGLE_CLOUD_PROJECT_ID',
  'GOOGLE_CLOUD_LOCATION',
  'GOOGLE_CLOUD_PROCESSOR_ID',
  'GOOGLE_CLOUD_PRIVATE_KEY_ID',
  'GOOGLE_CLOUD_PRIVATE_KEY',
  'GOOGLE_CLOUD_CLIENT_EMAIL',
  'GOOGLE_CLOUD_CLIENT_ID',
  'GOOGLE_CLOUD_CLIENT_X509_CERT_URL'
];

console.log('Environment Variables Status:');
console.log('─'.repeat(60));

let allPresent = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isPresent = !!value;
  const displayValue = isPresent ?
    (varName.includes('KEY') ? '[REDACTED]' : value.substring(0, 50) + '...') :
    'NOT SET';

  console.log(`${isPresent ? '✅' : '❌'} ${varName}: ${displayValue}`);

  if (!isPresent) allPresent = false;
});

console.log('─'.repeat(60));

// Check optional GOOGLE_CLOUD_CREDENTIALS
const credentialsVar = process.env.GOOGLE_CLOUD_CREDENTIALS;
console.log(`\nOptional GOOGLE_CLOUD_CREDENTIALS: ${credentialsVar ? '✅ SET' : '❌ NOT SET'}`);

// Validate private key format
if (process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
  const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
  const hasBeginMarker = privateKey.includes('-----BEGIN PRIVATE KEY-----');
  const hasEndMarker = privateKey.includes('-----END PRIVATE KEY-----');
  const hasNewlines = privateKey.includes('\\n');

  console.log('\nPrivate Key Format Check:');
  console.log(`  ${hasBeginMarker ? '✅' : '❌'} Has BEGIN marker`);
  console.log(`  ${hasEndMarker ? '✅' : '❌'} Has END marker`);
  console.log(`  ${hasNewlines ? '✅' : '❌'} Has escaped newlines (\\n)`);

  // Test if we can replace \\n with actual newlines
  try {
    const formattedKey = privateKey.replace(/\\n/g, '\n');
    console.log(`  ✅ Can format newlines correctly`);
  } catch (error) {
    console.log(`  ❌ Error formatting newlines: ${error.message}`);
  }
}

// Test service account credentials object construction
console.log('\n=== Service Account Credentials Object ===');
try {
  const credentials = {
    type: "service_account",
    project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
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

  console.log('✅ Credentials object constructed successfully');
  console.log(`   Project ID: ${credentials.project_id}`);
  console.log(`   Client Email: ${credentials.client_email}`);
  console.log(`   Private Key Length: ${credentials.private_key?.length || 0} characters`);
} catch (error) {
  console.log(`❌ Error constructing credentials: ${error.message}`);
}

// Summary
console.log('\n=== Summary ===');
if (allPresent) {
  console.log('✅ All required environment variables are configured');
  console.log('✅ OCR Service should initialize with service account credentials');
} else {
  console.log('❌ Some required environment variables are missing');
  console.log('⚠️  OCR Service will fall back to basic mode');
}

// Recommendation
console.log('\n=== Recommendation ===');
if (!credentialsVar && allPresent) {
  console.log('✅ Using individual environment variables (RECOMMENDED)');
  console.log('   No need to set GOOGLE_CLOUD_CREDENTIALS');
} else if (credentialsVar) {
  console.log('ℹ️  GOOGLE_CLOUD_CREDENTIALS is set');
  console.log('   Individual variables will be ignored');
} else {
  console.log('⚠️  Set either:');
  console.log('   1. Individual GOOGLE_CLOUD_* variables, OR');
  console.log('   2. GOOGLE_CLOUD_CREDENTIALS (base64-encoded JSON)');
}

console.log('\n' + '='.repeat(60) + '\n');
