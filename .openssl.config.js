/**
 * OpenSSL 3.x Configuration for Google Cloud gRPC compatibility
 *
 * This configuration addresses OpenSSL 3.x compatibility issues with older
 * gRPC implementations that may use legacy cipher suites or decoder routines.
 *
 * Error: error:1E08010C:DECODER routines::unsupported
 * Root Cause: OpenSSL 3.x deprecated certain legacy algorithms
 */

// Set environment variables for OpenSSL legacy provider
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS
  ? `${process.env.NODE_OPTIONS} --openssl-legacy-provider`
  : '--openssl-legacy-provider';

// Alternative: Set specific OpenSSL configuration
process.env.OPENSSL_CONF = process.env.OPENSSL_CONF || undefined;

// gRPC environment variables for enhanced compatibility
process.env.GRPC_VERBOSITY = process.env.GRPC_VERBOSITY || 'ERROR';
process.env.GRPC_TRACE = process.env.GRPC_TRACE || '';

module.exports = {};
