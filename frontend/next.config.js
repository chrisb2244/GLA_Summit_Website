/**
 * @type {import('next').NextConfig}
 */

module.exports = {
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
  }
}
