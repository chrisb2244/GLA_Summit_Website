import type { NextConfig } from 'next';
import { currentDisplayYear } from './src/app/configConstants';

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

// Content Security Policy, deployed Report-Only first (see headers() below).
// Notes on the sources:
//  - script/connect 'self' + va.vercel-scripts.com: Next's own bundles plus
//    Vercel Speed Insights (script + vitals beacon, whichever host it uses).
//  - 'unsafe-inline' (script & style): the App Router emits inline hydration
//    scripts, and next/font + JSX style={{...}} emit inline styles. A nonce
//    would remove the script 'unsafe-inline' but forces per-request dynamic
//    rendering, which fights this app's cacheComponents/ISR caching — revisit
//    if the Report-Only trial shows the policy is otherwise clean.
//  - img *.supabase.co + data: + blob: avatars/storage, data-URI images, and
//    the blob: object URLs the profile page makes for the avatar preview
//    (URL.createObjectURL in lib/profileImage.ts). i.ytimg.com covers YouTube
//    poster thumbnails surfaced alongside the youtube-nocookie embed.
//  - font-src 'self': next/font self-hosts Roboto at build time (no gstatic).
//  - frame-src youtube-nocookie: the YouTubeFrame embed.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com",
  'frame-src https://www.youtube-nocookie.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // Violation reporting, dual-delivery for cross-browser coverage:
  //  - report-uri: Firefox & Safari (legacy, still their only mechanism).
  //  - report-to: Chromium, naming the group in the Reporting-Endpoints header.
  // Browsers that support report-to use it and ignore report-uri (no dupes).
  'report-uri /api/csp-report',
  'report-to csp-endpoint'
].join('; ');

// Cache-safe security headers (no per-request nonce), applied to every route.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  // Defines the 'csp-endpoint' group referenced by the CSP `report-to`
  // directive (Chromium's Reporting API). Firefox/Safari ignore this and use
  // the `report-uri` directive instead.
  {
    key: 'Reporting-Endpoints',
    value: 'csp-endpoint="/api/csp-report"'
  },
  // Report-Only: surfaces violations without blocking. Switch
  // the key to 'Content-Security-Policy' to enforce once the trial is clean.
  {
    key: 'Content-Security-Policy-Report-Only',
    value: contentSecurityPolicy
  }
];

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
      revalidate: 3600*24, // 24 hours (background server refresh)
      expire: 3600*24*30 // 30 days (hard cap before a blocking refresh)
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
        source: '/agenda',
        destination: '/full-agenda',
        permanent: true
      },
      {
        source: '/presentations',
        destination: '/presentation-list',
        permanent: true
      },
      {
        source: '/submit-presentation',
        destination: '/my-presentations',
        permanent: true
      },
      {
        source: '/presentation-list',
        destination: `presentation-list/${currentDisplayYear}`,
        permanent: true
      },
      {
        source: '/presenters',
        destination: '/presenter-list',
        permanent: true
      },
      {
        source: '/presenter-list',
        destination: `presenter-list/${currentDisplayYear}`,
        permanent: true
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [...securityHeaders]
      }
    ];
  }
};

export default config;
