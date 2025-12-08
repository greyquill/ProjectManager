const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set output directory to root .next folder
  distDir: '.next',

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }

    return config
  },
}

module.exports = nextConfig

