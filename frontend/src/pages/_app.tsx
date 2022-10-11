import Head from 'next/head'
import { AppProps } from 'next/app'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { CacheProvider, EmotionCache } from '@emotion/react'
import { theme } from '../theme'
import createEmotionCache from '../createEmotionCache'
import { AppFrame } from '../Components/Layout/AppFrame'
import reportWebVitals from '../reportWebVitals'
import { AuthProvider } from '@/lib/sessionContext'
import { Fragment, useState } from 'react'
import type { Database } from '@/lib/sb_databaseModels'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
// import { setupServer } from 'msw/node'

import '../spinningLogo.css'
import '../GLA-generic.css'
import { MaintenanceModeProvider } from '@/lib/maintenanceModeContext'
import { SetupServerApi } from 'msw/lib/node'
import { handlers } from 'playwright/mocks/handlers'

// declare module '@mui/styles/defaultTheme' {
//   // eslint-disable-next-line @typescript-eslint/no-empty-interface
//   interface DefaultTheme extends Theme {}
// }

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()
const isMaintenancePage = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}

// if (process.env.PLAYWRIGHT === '1') {
//   console.log('loading mocks')
//   import('../../playwright/mocks').then(({initMocks}) => {
//     initMocks()
//   })
// } else {
//   console.log('not loading mocks')
// }

export const requestInterceptor = (process.env.PLAYWRIGHT === '1' && typeof window === 'undefined')
  ? (() => {
    console.log('Setting up reqHandler on server in app')
    const { setupServer } = require('msw/node') as typeof import('msw/node')
    const requestInterceptor: SetupServerApi = setupServer(...handlers)
    requestInterceptor.listen({
      onUnhandledRequest: 'bypass'
    })
    requestInterceptor.printHandlers()
    return requestInterceptor
  }) ()
  : undefined

const MyApp: React.FC<MyAppProps> = (props) => {
  const {
    Component,
    emotionCache = clientSideEmotionCache,
    pageProps: { ...pageProps }
  } = props

  const AppFrameElem = isMaintenancePage ? Fragment : AppFrame
  const [supabaseClient] = useState(() => createBrowserSupabaseClient<Database>())

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>GLA Summit 2022</title>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <MaintenanceModeProvider maintenanceMode={isMaintenancePage}>
            <AuthProvider supabase={supabaseClient}>
              <AppFrameElem>
                <Component {...pageProps} />
              </AppFrameElem>
            </AuthProvider>
          </MaintenanceModeProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </CacheProvider>
  )
}

export default MyApp

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals()
