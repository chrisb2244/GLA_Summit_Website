import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/ics/',
        '/my-presentations',
        '/my-profile',
        '/review-submissions',
        '/ticket/*'
      ]
    },
    sitemap: 'https://www.glasummit.org/sitemap.xml'
    // sitemap: 'https://acme.com/sitemap.xml',
  };
}
