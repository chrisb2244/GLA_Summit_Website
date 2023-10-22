import { Header } from './_rootElements/Header';
import { Footer } from './_rootElements/Footer';
import { roboto } from './font-workaround';

import './global.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | GLA Summit',
    default: 'GLA Summit 2024'
  },
  description: 'A global online LabVIEW conference'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
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
              {children}
            </div>
          </div>

          <Footer />
        </div>
      </body>
    </html>
  );
}
