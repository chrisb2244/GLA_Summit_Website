import type { NextApiRequest, NextApiResponse } from 'next'
import type { FormData } from '@/Components/Form/PresentationSubmissionForm'
import { sendMail } from '@/lib/sendMail'
import { generateBody } from '@/lib/presentationSubmissionHelpers'

const handlePresentationSubmission = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  // Need to send using e.g. fetch(..., { body: JSON.stringify({ formdata: data }) })
  const formData = req.body.formdata as FormData
  const to: string = formData.submitter.email ?? 'web@glasummit.org'

  const subject = `GLA Summit 2022 - Presentation Submission (${formData.title})`
  const { body, bodyPlain } = generateBody(formData)

  sendMail({ to, subject, body, bodyPlain })
    .then((info) => {
      res.status(201).json(info)
    })
    .catch((error) => {
      res.status(400).json(error)
    })

}

export default handlePresentationSubmission
