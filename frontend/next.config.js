/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /* config options here */
  reactStrictMode: true
}

module.exports = {
  nextConfig,
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
