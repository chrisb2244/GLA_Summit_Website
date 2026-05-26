import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  turbopack: {
    root: __dirname
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iuqlmccpbxtgcluccazt.supabase.co'
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1'
      }
    ],
    deviceSizes: [640, 1080, 1920],
    imageSizes: [320, 640],
    formats: ['image/webp'],
    minimumCacheTTL: 2678400,
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === 'true'
  },
  async redirects() {
    return [
      {
        source: '/presentations',
        destination: '/presentation-list',
        permanent: true
      },
      {
        source: '/submit-presentation',
        destination: '/my-presentations',
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

export default config;
