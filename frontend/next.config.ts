import type { NextConfig } from 'next';

// Allow the Supabase Storage host that THIS build talks to (prod or the test
// project), derived from NEXT_PUBLIC_SUPABASE_URL, so the image optimizer never
// 400s on avatars after switching projects. 127.0.0.1 is already covered below.
const supabaseImageHost = (():
  | { protocol: 'http' | 'https'; hostname: string }[] => {
  try {
    const { hostname, protocol } = new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    );
    if (!hostname || hostname === '127.0.0.1') return [];
    return [
      { protocol: protocol.replace(':', '') as 'http' | 'https', hostname }
    ];
  } catch {
    return [];
  }
})();

const config: NextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  cacheLife: {
    // Public content (presentations, presenters, agenda) is invalidated
    // on-demand: edits through the site call cacheTag/revalidateTag, and
    // external changes (acceptance/scheduling/video links) made directly in
    // Supabase fire a database webhook → /api/revalidate (see the
    // add_cache_revalidation_webhooks migration). With both paths covering
    // freshness, these times are now only a safety net for a missed webhook,
    // so they are lengthened to cut DB load.
    publicContent: {
      stale: 3600, // 1 hour (client)
      revalidate: 21600, // 6 hours (background server refresh)
      expire: 604800 // 1 week (hard cap before a blocking refresh)
    }
  },
  turbopack: {
    root: __dirname
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iuqlmccpbxtgcluccazt.supabase.co'
      },
      // Test/preview project host, derived from the build's Supabase URL.
      ...supabaseImageHost,
      {
        protocol: 'http',
        hostname: '127.0.0.1'
      }
    ],
    deviceSizes: [640, 1080, 1920],
    imageSizes: [320, 640],
    formats: ['image/webp'],
    minimumCacheTTL: 2678400,
    // Next.js 16's image optimizer blocks fetching from private/loopback IPs
    // (SSRF protection). Local Supabase storage is served from http://127.0.0.1,
    // so allow it locally to keep the optimizer (/_next/image) running just like
    // production. Vercel deploys fetch from a public *.supabase.co host and never
    // set this flag, so they keep the secure default (false).
    dangerouslyAllowLocalIP: process.env.NEXT_IMAGE_ALLOW_LOCAL_IP === 'true'
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
