import { PersonProps } from '@/Components/Form/Person'
import type { FormData } from '@/Components/Form/PresentationSubmissionForm'
import {
  Box,
  CssBaseline,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  ThemeProvider,
  Typography,
  TypographyProps
} from '@mui/material'
import { renderToString } from 'react-dom/server'
import { CacheProvider } from '@emotion/react'
import createEmotionCache from 'src/createEmotionCache'
import createEmotionServer from '@emotion/server/create-instance'
import { theme } from 'src/theme'

const FormRow: React.FC<{ label: string; value: string }> = ({
  label,
  value
}) => {
  return (
    <TableRow>
      <TableCell sx={{ width: '200px' }}>
        <Typography>{label}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ whiteSpace: 'pre-line' }}>{value}</Typography>
      </TableCell>
    </TableRow>
  )
}

const OtherPresenterRows: React.FC<{ presenters: PersonProps[] }> = ({
  presenters
}) => {
  if (presenters.length === 0) {
    return <FormRow label='Other Presenters:' value='None' />
  }
  return (
    <TableRow>
      <TableCell>
        <Typography>Other Presenters:</Typography>
      </TableCell>
      {presenters.map((p, idx) => {
        return (
          <TableRow key={`otherPresenter-${idx}`}>
            <TableCell>
              <Typography>{p.email}</Typography>
            </TableCell>
          </TableRow>
        )
      })}
    </TableRow>
  )
}

const HorizontalDivider: React.FC = () => {
  return (
    <TableRow
      sx={{ borderWidth: 2, borderColor: 'secondary.main', borderStyle: 'solid' }}
    />
  )
}

const P: React.FC<TypographyProps> = ({ children, ...props }) => (
  <Typography {...props}>{children}</Typography>
)

export const FormSubmissionEmail: React.FC<{ data: FormData }> = ({ data }) => {
  const submitterName = `${data.submitter.firstName} ${data.submitter.lastName}`
  return (
    <Box sx={{ maxWidth: 800 }}>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell sx={{p:0}}>
              <P>Thank you for submitting a presentation for GLA Summit 2022!</P>
              <P>The data you submitted is shown below.</P>
            </TableCell>
            <TableCell sx={{p:0}}>
              <img
                src='https://iuqlmccpbxtgcluccazt.supabase.co/storage/v1/object/public/public-images/GLA-logo.png?t=2022-05-20T09:06:14.131Z'
                height={80}
                width={80}
                alt='GLA logo'
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Paper>
        <Box>
          <Table>
            <TableBody>
              <FormRow label='Title:' value={data.title} />
              <FormRow label='Abstract:' value={data.abstract} />
              <FormRow label='Learning points:' value={data.learningPoints} />
              <HorizontalDivider />
              <FormRow label='Submitter Name:' value={submitterName} />
              <FormRow label='Submitter Email:' value={data.submitter.email} />
              <HorizontalDivider />
              <OtherPresenterRows presenters={data.otherPresenters} />
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  )
}

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
