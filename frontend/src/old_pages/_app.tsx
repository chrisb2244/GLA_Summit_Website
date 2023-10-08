import Head from 'next/head'
import { AppProps } from 'next/app'
import { AppFrame } from '../Components/Layout/AppFrame'
import reportWebVitals from '../reportWebVitals'
import { AuthProvider } from '@/lib/sessionContext'
import { useState } from 'react'
import type { Database } from '@/lib/sb_databaseModels'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'

import '../spinningLogo.css'
import '../GLA-generic.css'

interface MyAppProps extends AppProps {}

const MyApp: React.FC<React.PropsWithChildren<MyAppProps>> = (props) => {
  const {
    Component,
    pageProps: { ...pageProps }
  } = props

  const [supabaseClient] = useState(() =>
    createBrowserSupabaseClient<Database>()
  )

  return (
    <>
      <Head>
        <title>GLA Summit 2022</title>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <AuthProvider supabase={supabaseClient}>
        <AppFrame>
          <Component {...pageProps} />
        </AppFrame>
      </AuthProvider>
    </>
  )
}

export default MyApp

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
