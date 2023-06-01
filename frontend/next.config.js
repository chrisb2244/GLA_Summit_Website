/**
 * @type {import('next').NextConfig}
 */

module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['iuqlmccpbxtgcluccazt.supabase.co']
  },
  async headers() {
    return [
      {
        // Append the "Service-Worker-Allowed" header
        // to every response, overriding the default worker's scope.
        source: '/(.*)',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          }
        ]
      }
    ]
  },
}
