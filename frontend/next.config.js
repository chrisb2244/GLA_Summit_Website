/**
 * @type {import('next').NextConfig}
 */

module.exports = {
  experimental: {
    appDir: true
  },
  reactStrictMode: true,
  images: {
    domains: ['iuqlmccpbxtgcluccazt.supabase.co']
  },
  redirects() {
    const maintenanceModeRedirect = 
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"
        ? { source: "/(.+)", destination: '/', permanent: false}
        : null
    
    return [
      maintenanceModeRedirect,
    ].filter(Boolean)
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
