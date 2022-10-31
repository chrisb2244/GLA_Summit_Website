import { Header } from './HeaderSrv'
import { Footer } from './FooterSrv'
import { Roboto } from '@next/font/google'

// import '../css/global.css'
import './global.css'
import '../GLA-generic.css'
import { ClientProviders } from "./ClientProviders";

const roboto = Roboto({ weight: ['300', '400'], subsets: ['latin'], preload: true })

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' className={roboto.className}>
      <head>
        <title>GLA Summit 2022</title>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </head>

      <body>
        <ClientProviders>
        <div className='flex flex-col min-h-screen'>
          <Header/>

          <div style={{ flex: '1 0 auto', display: 'flex' }}>
            {/* w: 100% for up to small (i.e. xs), 80% for larger than "md" */}
            <div className='max-w-screen-lg w-full md:w-4/5 mx-auto flex flex-col'>
              {children}
            </div>
          </div>

          <Footer />
        </div>
        </ClientProviders>
      </body>
    </html>
  )
}
