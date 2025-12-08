const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set output directory to root .next folder
  distDir: '.next',

  // Improve development experience
  reactStrictMode: true,

  // Disable caching in development for better reliability
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      // Period (in ms) where the server will keep pages in the buffer
      maxInactiveAge: 25 * 1000,
      // Number of pages that should be kept simultaneously without being disposed
      pagesBufferLength: 2,
    },
  }),

  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }

    // Aggressive cache clearing in development
    if (dev) {
      // Use memory-only caching in development (no persistent cache)
      config.cache = {
        type: 'memory',
      }

      // Improve file watching for better HMR
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      }

      // Clear module cache on changes
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        moduleIds: 'named',
        chunkIds: 'named',
      }
    }

    return config
  },
}

module.exports = nextConfig

