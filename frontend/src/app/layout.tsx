import { Header } from './_rootElements/Header'
import { Footer } from './_rootElements/Footer'
import { roboto } from './font-workaround'

import './global.css'
import '../GLA-generic.css'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' className={roboto.className}>
      <head>
        <title>GLA Summit 2024</title>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </head>

      <body>
        <div className='flex flex-col min-h-screen'>
          <Header/>

          <div style={{ flex: '1 0 auto', display: 'flex' }}>
            {/* w: 100% for up to small (i.e. xs), 80% for larger than "md" */}
            <div className='max-w-screen-lg w-[85%] md:w-4/5 mx-auto flex flex-col'>
              {children}
            </div>
          </div>

          <Footer />
        </div>
      </body>
    </html>
  )
}
