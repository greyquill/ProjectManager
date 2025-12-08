const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set output directory to root .next folder
  distDir: '.next',

  // Improve development experience
  reactStrictMode: true,

  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }

    // Improve cache handling in development
    if (dev) {
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
      }
    }

    return config
  },
}

module.exports = nextConfig

