/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /* config options here */
  reactStrictMode: true
}

// Return custom headers for NextAuth.
// See https://github.com/nextauthjs/next-auth/issues/2408
// and https://nextjs.org/docs/api-reference/next.config.js/headers
const headers = async () => {
  return [
    {
      source: '/api/auth/:slug',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, max-age=0'
        }
      ]
    }
  ]
}

module.exports = {
  nextConfig,
  headers
}
