const config = {
  reactStrictMode: true,
  images: {
    domains: ['tokens.1inch.exchange'],
  }
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
module.exports = withBundleAnalyzer(config);
