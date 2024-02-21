import { Header } from './_rootElements/Header';
import { Footer } from './_rootElements/Footer';
import { roboto } from './font-workaround';
import { SpeedInsights } from '@vercel/speed-insights/next';

import './global.css';
import type { Metadata } from 'next';

const baseUrl =
  process.env.NEXT_PUBLIC_BASEURL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${process.env.PORT ?? 3000}`;

export const metadata: Metadata = {
  title: {
    template: '%s | GLA Summit',
    default: 'GLA Summit 2024'
  },
  metadataBase: new URL(baseUrl),
  description: 'A global online LabVIEW conference',
  openGraph: {
    title: 'GLA Summit 2024',
    description: 'A global online LabVIEW conference',
    url: 'https://www.glasummit.org',
    type: 'website',
    siteName: 'GLA Summit 2024'
  }
};

export default function RootLayout(props: {
  children: React.ReactNode;
  loginModal: React.ReactNode;
}) {
  return (
    <html lang='en' className={roboto.className}>
      <head>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </head>

      <body>
        <div className='flex min-h-screen flex-col'>
          <Header />

          <div style={{ flex: '1 0 auto', display: 'flex' }}>
            <div className='mx-auto mb-8 flex w-[85%] max-w-screen-lg flex-col md:w-4/5'>
              {props.children}
              {props.loginModal}
            </div>
          </div>
          <Footer />
        </div>
        <SpeedInsights />
      </body>
    </html>
  );
}
