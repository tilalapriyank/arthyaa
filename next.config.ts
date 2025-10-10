import type { NextConfig } from "next";

// Load OpenSSL configuration for Google Cloud gRPC compatibility
// This addresses OpenSSL 3.x compatibility issues with gRPC
try {
  require('./.openssl.config.js');
} catch (error) {
  // Silently ignore if config doesn't exist
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Webpack configuration for Node.js runtime compatibility
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure proper handling of gRPC native modules
      config.externals = config.externals || [];
      config.externals.push({
        '@grpc/grpc-js': '@grpc/grpc-js',
      });
    }
    return config;
  },
};

export default nextConfig;
