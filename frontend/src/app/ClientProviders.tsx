'use client'

import { AuthProvider } from '@/lib/sessionContext'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { CacheProvider, EmotionCache } from '@emotion/react'
import { theme } from '../theme'
import createEmotionCache from '../createEmotionCache'
import React, { useState } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/sb_databaseModels'


// const clientSideEmotionCache = createEmotionCache()

export const ClientProviders: React.FC<{
  children?: React.ReactNode
}> = ({ children }) => {
  const [supabaseClient] = useState(() =>
    createPagesBrowserClient<Database>()
  )


  return (
    <AuthProvider
      supabase={supabaseClient}
      // initialSession={null}
    >
      {children}
    </AuthProvider>
  );

  return (
    // <CacheProvider value={clientSideEmotionCache}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <AuthProvider supabase={supabaseClient}>{children}</AuthProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    // </CacheProvider>
  )
}
