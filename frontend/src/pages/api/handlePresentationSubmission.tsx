import type { NextApiRequest, NextApiResponse } from 'next'
import type { FormData } from '@/Components/Form/PresentationSubmissionForm'
import { EmailContent, sendMail } from '@/lib/sendMail'
import {
  inviteOtherPresenter,
  uploadPresentationData,
  EmailToSubmitter,
  EmailToNewOtherPresenter,
  EmailToExistingOtherPresenter
} from '@/lib/presentationSubmissionHelpers'
import { generateBody } from '@/lib/emailGeneration'
import { createAdminClient } from '@/lib/supabaseClient'
import type { SupabaseClient } from '@supabase/supabase-js'
import { PresentationPresentersModel, ProfileModel } from '@/lib/databaseModels'
import { PersonProps } from '@/Components/Form/Person'
import { myLog } from '@/lib/utils'

const handlePresentationSubmission = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const adminClient = createAdminClient()

  // Need to send using e.g. fetch(..., { body: JSON.stringify({ formdata: data, submitterId: id }) })
  const formData = req.body.formdata as FormData
  const submitter_id = req.body.submitterId as string
  const sendEmails = req.body.sendEmails as boolean
  const presentationId = req.body.presentationId as string

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
  const idAndInfoArray = await getEmailInfoAndIds(
    formData,
    adminClient,
    submitter_id
  )
  const emailInfoArray = idAndInfoArray.map((v) => v.emailOptions)
  const idArray = idAndInfoArray.map((v) => v.id)

  // Upload presenter information
  const uploadData: PresentationPresentersModel[] = idArray.map(
    (presenter_id) => {
      return { presenter_id, presentation_id }
    }
  )

  await adminClient
    .from<PresentationPresentersModel>('presentation_presenters')
    .upsert(uploadData, { returning: 'minimal' })

  // Send all emails
  if (typeof sendEmails === 'undefined' || sendEmails) {
    // Default to sending, unless directed not to send via the data content
    myLog(`Sending emails to ${emailInfoArray.length} recipient(s)`)
    return Promise.all(emailInfoArray.map(sendMail)).then((statusArray) => {
      const failedEmails = statusArray
        .filter((s) => {
          return s.rejected.length > 0
        })
        .flatMap((s) => s.rejected)

      if (failedEmails.length === 0) {
        return res.status(201).json({ message: 'success' })
      } else {
        myLog({ failedEmails, errMessage: 'Not all emails could be sent' })
        return res
          .status(201)
          .json({ message: 'not all emails could be sent', failedEmails })
      }
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
  submitterId: string
) => {
  // Data for the form submitter
  const formSubmitterOptions = emailOptionsForFormSubmitter(formData)

  const otherPresenterEmails = formData.otherPresenters.map((p) => p.email)
  const emailOtherPresentersChain = await adminClient.auth.api
    .listUsers()
    .then(({ data: userList, error }) => {
      if (error) throw error

      // Create a map from email to existing userIds
      return new Map(
        userList
          .filter((u) => typeof u.email !== 'undefined')
          .map((u) => {
            // email is always defined after filter
            /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
            return [u.email!, u.id]
          })
      )
    })
    .then((emailMap) => {
      return otherPresenterEmails.map((email) => {
        return {
          email,
          // Must be defined if has(email) is true
          /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
          id: emailMap.has(email) ? emailMap.get(email)! : null
        }
      })
    })
    .then(async (emailIdList) => {
      const idAndInfo = await Promise.all(
        emailIdList.map(async ({ email, id }) => {
          if (id !== null) {
            // Existing account, notify
            const { data, error } = await adminClient
              .from<ProfileModel>('profiles')
              .select()
              .eq('id', id)
              .single()
            if (error) throw error
            const otherPresenter: PersonProps = {
              email,
              firstName: data.firstname,
              lastName: data.lastname
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
            const emailOptions = emailOptionsForNewOtherPresenter(
              formData,
              email
            )
            const newId = await inviteOtherPresenter(email)
            return {
              id: newId,
              emailOptions
            }
          }
        })
      )
      return idAndInfo
    })

  return [{ id: submitterId, emailOptions: formSubmitterOptions }].concat(
    emailOtherPresentersChain
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
  email: string
): EmailContent => {
  const emailComponent = <EmailToNewOtherPresenter data={data} email={email} />
  const plainText =
    `You have been listed as a co-presenter for GLA Summit 2022.\n` +
    `Please use the login form there and add profile information ` +
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
