/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
  webpack: (config) => {
    config.cache = false
    return config
  }
}

module.exports = nextConfig
