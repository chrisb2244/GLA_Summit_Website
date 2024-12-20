import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    ppr: true
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
    ]
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
  }
};

export default config;
