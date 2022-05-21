import type { FormData } from '@/Components/Form/PresentationSubmissionForm'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { renderToString } from 'react-dom/server'
import { CacheProvider } from '@emotion/react'
import createEmotionCache from 'src/createEmotionCache'
import createEmotionServer from '@emotion/server/create-instance'
import { theme } from 'src/theme'
import { FormSubmissionEmail } from 'src/EmailTemplates/FormSubmissionEmail'

function renderFullPage(html: string, css: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        ${css}
      </head>
      <body>
        <div id="root">${html}</div>
      </body>
    </html>
  `
}

export const generateBody = (
  formData: FormData
): { body: string; bodyPlain: string } => {
  const cache = createEmotionCache()
  const { extractCriticalToChunks, constructStyleTagsFromChunks } =
    createEmotionServer(cache)

  const renderTarget = (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FormSubmissionEmail data={formData} />
      </ThemeProvider>
    </CacheProvider>
  )
  const html = renderToString(renderTarget)
  const chunks = extractCriticalToChunks(html)
  const styles = constructStyleTagsFromChunks(chunks)

  const htmlBody = renderFullPage(html, styles)

  return {
    body: htmlBody,
    bodyPlain:
      `Thank you for submitting your presentation for GLA Summit 2022\n\n` +
      `The non-HTML version of this email has reduced content - if you're seeing this and want more content in future emails, ` +
      `please contact web@glasummit.org and let us know that non-HTML-rendered emails are important to you!`
  }
}
