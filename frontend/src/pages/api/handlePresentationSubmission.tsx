import type { NextApiRequest, NextApiResponse } from 'next'
import type { FormData } from '@/Components/Forms/PresentationSubmissionForm'
import { EmailContent, sendMailApi } from '@/lib/sendMail'
import {
  uploadPresentationData,
  EmailToSubmitter,
  EmailToNewOtherPresenter,
  EmailToExistingOtherPresenter
} from '@/lib/presentationSubmissionHelpers'
import { generateBody } from '@/lib/emailGeneration'
import { createAdminClient } from '@/lib/supabaseClient'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/sb_databaseModels'
import { PersonProps } from '@/Components/Form/Person'
import { logErrorToDb, myLog } from '@/lib/utils'
import { generateInviteLink } from '@/lib/generateSupabaseLinks'

const handlePresentationSubmission = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const adminClient = createAdminClient()

  // Need to send using e.g. fetch(..., { body: JSON.stringify({ formdata: data, submitterId: id }) })
  const formData = req.body.formdata as FormData
  const submitter_id = req.body.submitterId as string
  const sendEmails = (req.body.sendEmails as boolean | undefined) ?? true
  const presentationId = req.body.presentationId as string | undefined

  if (typeof formData === 'undefined' || typeof submitter_id === 'undefined') {
    return res.status(400).json('Missing data elements')
  }
  if (submitter_id == null) {
    return res.status(401).json('No user ID passed - authentication failure')
  }

  const presentation_id = await uploadPresentationData(
    formData,
    submitter_id,
    presentationId
  )

  // Get the IDs and necessary information to send the emails
  const otherPresenterEmails = formData.otherPresenters.map((p) => p.email)
  const { data, error } = await adminClient
    .from('email_lookup')
    .select('*')
    .in('email', otherPresenterEmails)
  if (error) {
    myLog(error)
    logErrorToDb(error, 'error', submitter_id)
    throw error
  }
  const otherPresenterIds = data.map((p) => p.id) ?? []
  const idArray = otherPresenterIds.concat(submitter_id)

  // Upload presenter information
  type PresentationPresentersRow =
    Database['public']['Tables']['presentation_presenters']['Row']
  const presentationPresenterData: PresentationPresentersRow[] = idArray.map(
    (presenter_id) => {
      return { presenter_id, presentation_id }
    }
  )

  await adminClient
    .from('presentation_presenters')
    .upsert(presentationPresenterData)

  // Send all emails
  if (sendEmails) {
    const idAndInfoArray = await getEmailInfoAndIds(
      formData,
      adminClient,
      submitter_id,
      data
    )
    const emailInfoArray = idAndInfoArray.map((v) => v.emailOptions)
    // Default to sending, unless directed not to send via the data content
    myLog(`Sending emails to ${emailInfoArray.length} recipient(s)`)
    return Promise.all(emailInfoArray.map(sendMailApi)).then((statusArray) => {
      const failedEmails = statusArray
        .filter((s) => {
          return s.rejected.length > 0
        })
        .flatMap((s) => s.rejected)

      if (failedEmails.length !== 0) {
        myLog({ failedEmails, errMessage: 'Not all emails could be sent' })
        // return res
        // .status(201)
        // .json({ message: 'not all emails could be sent', failedEmails })
      }
      return res.status(201).json({ message: 'success' })
    })
  } else {
    // Don't send email
    return res.status(201).json({ message: 'success' })
  }
}

// Return the userIds for each presenter (new or existing)
// : Promise<{ submissionEmailSent: boolean; otherPresenterIds: string[] }>
const getEmailInfoAndIds = async (
  formData: FormData,
  adminClient: SupabaseClient,
  submitterId: string,
  otherPresentersEmailIdList: { email: string; id: string }[]
) => {
  // Data for the form submitter
  const formSubmitterOptions = emailOptionsForFormSubmitter(formData)

  const idAndInfo = await Promise.all(
    otherPresentersEmailIdList.map(async ({ email, id }) => {
      if (id !== null) {
        // Existing account, notify
        const { data, error } = await adminClient
          .from('profiles')
          .select()
          .eq('id', id)
          .single()
        if (error) throw error
        const otherPresenter: PersonProps = {
          email,
          firstName: data.firstname ?? '',
          lastName: data.lastname ?? ''
        }
        const emailOptions = emailOptionsForExistingOtherPresenter(
          formData,
          otherPresenter
        )
        return {
          id,
          emailOptions
        }
      } else {
        // New account, invite
        // This also provides the action link, which we should probably use...
        const { newUserId, confirmationLink } = await generateInviteLink(
          email,
          '/my-profile'
        )
        const emailOptions = emailOptionsForNewOtherPresenter(
          formData,
          email,
          confirmationLink
        )
        return {
          id: newUserId,
          emailOptions
        }
      }
    })
  )

  return [{ id: submitterId, emailOptions: formSubmitterOptions }].concat(
    idAndInfo
  )
}

// const saveDraft = async (formData: FormData) => {}

const emailOptionsForFormSubmitter = (data: FormData): EmailContent => {
  const emailComponent = <EmailToSubmitter data={data} />
  const plainText = `Thank you for submitting your presentation for GLA Summit 2022\n\n`
  const { body, bodyPlain } = generateBody(emailComponent, plainText)

  return {
    to: data.submitter.email,
    subject: `GLA Summit 2022 - Presentation Submission (${data.title})`,
    body,
    bodyPlain
  }
}

const emailOptionsForExistingOtherPresenter = (
  data: FormData,
  otherPresenter: PersonProps
): EmailContent => {
  const emailComponent = (
    <EmailToExistingOtherPresenter data={data} receiver={otherPresenter} />
  )
  const plainText = `You have been listed as a co-presenter for GLA Summit 2022\n\n`
  const { body, bodyPlain } = generateBody(emailComponent, plainText)
  return {
    to: otherPresenter.email,
    subject: `GLA Summit 2022 - Presentation Submission (${data.title})`,
    body,
    bodyPlain
  }
}

const emailOptionsForNewOtherPresenter = (
  data: FormData,
  email: string,
  confirmationLink?: string
): EmailContent => {
  const emailComponent = <EmailToNewOtherPresenter data={data} email={email} />
  const actionLine = confirmationLink
    ? `Please use this link to navigate to your profile page and add profile information:\n${confirmationLink}\n`
    : 'Please use the login form there and add profile information '
  const plainText =
    `You have been listed as a co-presenter for GLA Summit 2022.\n` +
    actionLine +
    `or contact web@glasummit if you believe this is a mistake.\n\n`

  const { body, bodyPlain } = generateBody(emailComponent, plainText)
  return {
    to: email,
    subject: `GLA Summit 2022 - Presentation Submission (${data.title})`,
    body,
    bodyPlain
  }
}

export default handlePresentationSubmission
