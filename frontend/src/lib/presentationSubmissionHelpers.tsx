import type { FormData } from '@/Components/Form/PresentationSubmissionForm'
import { createAdminClient } from './supabaseClient'
import { FormSubmissionEmail } from '@/EmailTemplates/FormSubmissionEmail'
import { PresentationSubmissionsModel } from './databaseModels'
import { Session, User } from '@supabase/supabase-js'
import { buildSubmitterName, P } from '@/EmailTemplates/emailComponents'
import { PersonProps } from '@/Components/Form/Person'
import { myLog } from './utils'

// This function needs to return the new userId for the invited account
export const generateInviteCode = async (email: string, redirectTo?: string) => {
  myLog(`Inviting new user: ${email}`)

  const adminClient = createAdminClient()
  return adminClient.auth.api
    .generateLink('invite', email, {redirectTo, data: {
      firstname: '',
      lastname: ''
    }})
    .then(({ data, error }) => {
      if (error) return Promise.reject(error)
      if (data == null) {
        // Shouldn't get here...
        return Promise.reject(error)
      }
      myLog({ data })
      if (Object.hasOwn(data, 'user')) {
        // I don't think this branch is used
        myLog('Data was a Session object')
        const dataS = data as Session
        const id = dataS.user?.id
        if (typeof id !== 'undefined') {
          return { newUserId: id, confirmationLink: undefined }
        }
        return Promise.reject('No user found')
      } else {
        myLog('Data was a User object')
        const dataU = data as User
        return { newUserId: dataU.id, confirmationLink: dataU.action_link }
      }
    })
}

export const uploadPresentationData = async (
  formData: FormData,
  submitterId: string,
  presentationId?: string
) => {
  const adminClient = createAdminClient()
  const content = {
    submitter_id: submitterId,
    is_submitted: formData.isFinal,
    title: formData.title,
    abstract: formData.abstract,
    learning_points: formData.learningPoints,
    presentation_type: formData.presentationType
  }
  if (typeof presentationId === 'undefined') {
    return adminClient
      .from<PresentationSubmissionsModel>('presentation_submissions')
      .insert(content)
      .single()
      .then(({ data, error }) => {
        if (error) throw error
        // Need the presentation submission ID to add rows to the presentation_presenters table
        return data.id
      })
  } else {
    return adminClient
      .from<PresentationSubmissionsModel>('presentation_submissions')
      .upsert({ ...content, id: presentationId })
      .single()
      .then(({ data, error }) => {
        if (error) throw error
        // Need the presentation submission ID to add rows to the presentation_presenters table
        return data.id
      })
  }
}

export const EmailToSubmitter: React.FC<{ data: FormData }> = ({ data }) => {
  const isSubmitted = data.isFinal

  const introText = isSubmitted ? (
    <P sx={{ textAlign: 'justify' }}>
      Thank you for submitting a presentation for GLA Summit 2022!
    </P>
  ) : (
    <P sx={{ textAlign: 'justify' }}>
      We&apos;ve stored your draft presentation for GLA Summit 2022!
      <br />
      Please feel free to edit it as you need until you&apos;re ready to submit
      it via the &quot;My Presentations&quot; page.
    </P>
  )
  const headerText = (
    <>
      {introText}
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
