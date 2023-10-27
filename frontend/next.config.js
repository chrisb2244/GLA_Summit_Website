/**
 * @type {import('next').NextConfig}
 */

module.exports = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  images: {
    domains: ['iuqlmccpbxtgcluccazt.supabase.co']
  },
  async redirects() {
    return [
      {
        source: '/presentations',
        destination: '/presentation-list',
        permanent: true
      }
    ];
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
            value: '/'
          }
        ]
      }
    ];
  }
};
