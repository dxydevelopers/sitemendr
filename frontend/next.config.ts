import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

// Bundle analyzer for performance monitoring
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.sitemendr.com',
        pathname: '/uploads/**',
      },

      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.simpleicons.org',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
    // Enable image optimization (disable if using external service)
    unoptimized: false,
    
    // Minimum cache TTL
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    
    // Format priority
    formats: ['image/avif', 'image/webp'],
    
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Image sizes for srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Compression
  compress: true,
  
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['date-fns'],
  },

  // Turbopack expects an absolute project root.
  turbopack: {
    root: process.cwd(),
  },

  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Only optimize production client-side builds
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Separate vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 20,
            },
            // Common chunks
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.js',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development'
              ? 'no-store, must-revalidate'
              : 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.css',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development'
              ? 'no-store, must-revalidate'
              : 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
