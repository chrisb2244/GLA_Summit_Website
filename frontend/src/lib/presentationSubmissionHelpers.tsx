import type { FormData } from '@/Components/Form/PresentationSubmissionForm'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { renderToString } from 'react-dom/server'
import { CacheProvider } from '@emotion/react'
import createEmotionCache from 'src/createEmotionCache'
import createEmotionServer from '@emotion/server/create-instance'
import { theme } from 'src/theme'
import { createAdminClient } from './supabaseClient'
import { FormSubmissionEmail } from '@/EmailTemplates/FormSubmissionEmail'
import { PresentationSubmissionsModel } from './databaseModels'
import { Session, User } from '@supabase/supabase-js'
import { buildSubmitterName, P } from '@/EmailTemplates/emailComponents'
import { PersonProps } from '@/Components/Form/Person'
import { myLog } from './utils'

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

const generateHTMLBody = (emailComponent: JSX.Element) => {
  const cache = createEmotionCache()
  const { extractCriticalToChunks, constructStyleTagsFromChunks } =
    createEmotionServer(cache)

  const renderTarget = (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {emailComponent}
      </ThemeProvider>
    </CacheProvider>
  )
  const html = renderToString(renderTarget)
  const chunks = extractCriticalToChunks(html)
  const styles = constructStyleTagsFromChunks(chunks)

  return renderFullPage(html, styles)
}

export const generateBody = (
  emailComponent: JSX.Element,
  plainText: string
) => {
  const footer =
    `The non-HTML version of this email has reduced content - if you're ` +
    `seeing this and want more content in future emails, please contact ` +
    `web@glasummit.org and let us know that non-HTML-rendered emails are ` +
    `important to you!`

  return {
    body: generateHTMLBody(emailComponent),
    bodyPlain: plainText + footer
  }
}

// This function needs to return the new userId for the invited account
export const inviteOtherPresenter = async (email: string) => {
  myLog(`Inviting new user: ${email}`)

  const adminClient = createAdminClient()
  return adminClient.auth.api
    .generateLink('invite', email, {})
    .then(({ data, error }) => {
      if (error) return Promise.reject(error)
      if (data == null) {
        // Shouldn't get here...
        return Promise.reject(error)
      }
      myLog({ data })
      if (Object.hasOwn(data, 'user')) {
        myLog('Data was a Session object')
        const dataS = data as Session
        const id = dataS.user?.id
        if (typeof id !== 'undefined') {
          return id
        }
        return Promise.reject('No user found')
      } else {
        myLog('Data was a User object')
        const dataU = data as User
        return dataU.id
      }
    })
}

export const uploadPresentationData = async (
  formData: FormData,
  submitterId: string,
  isFinal = true
) => {
  const adminClient = createAdminClient()
  return adminClient
    .from<PresentationSubmissionsModel>('presentation_submissions')
    .insert({
      submitter_id: submitterId,
      is_submitted: isFinal,
      title: formData.title,
      abstract: formData.abstract,
      learning_points: formData.learningPoints,
      presentation_type: formData.presentationType
    })
    .single()
    .then(({ data, error }) => {
      if (error) throw error
      // Need the presentation submission ID to add rows to the presentation_presenters table
      return data.id
    })
}

export const EmailToSubmitter: React.FC<{ data: FormData }> = ({ data }) => {
  const headerText = (
    <>
      <P>Thank you for submitting a presentation for GLA Summit 2022!</P>
      <P>The data you submitted is shown below.</P>
    </>
  )
  return <FormSubmissionEmail data={data} headerText={headerText} />
}

export const EmailToExistingOtherPresenter: React.FC<{
  data: FormData
  receiver: PersonProps
}> = ({ data, receiver }) => {
  const submitterName = buildSubmitterName(data)
  const recipFName = receiver.firstName
  const recipLName = receiver.lastName
  const recipientName =
    typeof recipFName === 'undefined' && typeof recipLName === 'undefined'
      ? receiver.email
      : [recipFName, recipLName].join(' ')

  const headerText = (
    <>
      <P>{`Dear ${recipientName},`}</P>
      <P>{`You have been added as a co-presenter by ${submitterName} to the presentation shown below.`}</P>
      <P>
        You will now be able to see this submission (and any changes made over
        time) in your &apos;My Presentations&apos; page whilst logged in to
        https://glasummit.org
      </P>
    </>
  )

  return <FormSubmissionEmail data={data} headerText={headerText} />
}

export const EmailToNewOtherPresenter: React.FC<{
  data: FormData
  email: string
}> = ({ data, email }) => {
  const submitterName = buildSubmitterName(data)

  const headerText = (
    <>
      <P>{`Dear ${email},`}</P>
      <P>
        {'You have been added as a co-presenter for GLA 2022 by ' +
          submitterName +
          ' to the presentation shown below.'}
      </P>
      <P>
        You will now be able to see this submission (and any changes made over
        time) in your &apos;My Presentations&apos; page whilst logged in to
        https://glasummit.org
      </P>
      <P>
        An account for this email address has been automatically created, but no
        profile data has been generated. Please use the login rather than
        registration form at https://glasummit.org and then use the &apos;My
        Profile&apos; page to set your name, and if you wish, a short
        description and/or image.
      </P>
      <P>
        If you believe that this email was sent to you by mistake (if you did
        not expect to be listed as a co-presenter on this presentation) then
        please contact web@glasummit.org or reply to this email and we will
        remove you (and optionally your created account).
      </P>
    </>
  )

  return <FormSubmissionEmail data={data} headerText={headerText} />
}
