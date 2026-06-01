import { Header } from './_rootElements/Header';
import { Footer } from './_rootElements/Footer';
import { roboto } from './font-workaround';
import type { Metadata } from 'next';
import { SpeedInsightsWrapper } from './_rootElements/SpeedInsightsWrapper';
import {
  buildOpenGraph,
  ogImageUrl,
  siteDescription,
  siteTitle
} from './sharedMetadata';

import './global.css';

// Resolve the absolute origin used to expand relative metadata URLs
// (e.g. the og:image route).
// If NEXT_PUBLIC_BASEURL is set, use that;
// Otherwise, if VERCEL_ENV is production, use the production URL;
// Otherwise, if VERCEL_URL is set, use that as the base URL (preview deploys);
// Otherwise, assume we're in local development and use localhost with the appropriate port.
const baseUrl = process.env.NEXT_PUBLIC_BASEURL
  ? process.env.NEXT_PUBLIC_BASEURL.startsWith('http')
    ? process.env.NEXT_PUBLIC_BASEURL
    : `https://${process.env.NEXT_PUBLIC_BASEURL}`
  : process.env.VERCEL_ENV === 'production'
  ? 'https://www.glasummit.org'
  : process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://localhost:${process.env.PORT ?? 3000}`;

export const metadata: Metadata = {
  title: {
    template: '%s | GLA Summit',
    default: siteTitle
  },
  metadataBase: new URL(baseUrl),
  description: siteDescription,
  alternates: { canonical: '/' },
  openGraph: buildOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [ogImageUrl]
  }
};

export default function RootLayout(props: {
  children: React.ReactNode;
  // loginModal: React.ReactNode;
}) {
  return (
    <html lang='en' className={roboto.className}>
      <head>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </head>

      <body>
        <a
          href='#main-content'
          className='sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:shadow'
        >
          Skip to main content
        </a>
        <div className='flex min-h-screen flex-col'>
          <Header />

          <div style={{ flex: '1 0 auto', display: 'flex' }}>
            <main
              id='main-content'
              tabIndex={-1}
              className='mx-auto mb-8 flex w-[85%] max-w-screen-lg flex-col focus:outline-none md:w-4/5'
            >
              {props.children}
              {/* {props.loginModal} */}
            </main>
          </div>
          <Footer />
        </div>
        <SpeedInsightsWrapper />
      </body>
    </html>
  );
}
