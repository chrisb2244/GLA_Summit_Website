import { generateSupabaseLinks } from '@/lib/generateSupabaseLinks'
import type { GenerateLinkBody, LinkType } from '@/lib/generateSupabaseLinks'
import { NextApiHandler } from 'next'
import { sendMailApi } from '@/lib/sendMail'
import { generateBody } from '@/lib/emailGeneration'
import { RegistrationEmail } from '@/EmailTemplates/RegistrationEmail'
import { SignInEmail } from '@/EmailTemplates/SignInEmail'

const handler: NextApiHandler = async (req, res) => {
  // Need 'type', 'email', and 'options', where options is a struct with 'password', 'data' and 'redirectTo'.
  // 'data''s required/optional contents are unclear... But it might be a signup only
  // password might also be signup only (README.md in github.com/supabase/gotrue)
  // data looks to have the same format as the 'data' object accepted by signUp.
  
  const bodyData = req.body.bodyData as GenerateLinkBody
  if (typeof bodyData === 'undefined') {
    return res
      .status(401)
      .json({ message: 'Missing data to handle the required operation' })
  }
  const type = bodyData.type

  // return generateSupabaseLinks(bodyData)
  // const fnPromise = IS_TEST_ONLY_DO_NOT_SEND_EMAILS ? dummyGenerateLinks(type) : generateSupabaseLinks(bodyData)
  const fnPromise = generateSupabaseLinks(bodyData)
  return fnPromise
    .then(({ data, error, linkType }) => {
      if (error) throw error
      if (typeof data.properties.action_link === 'undefined') {
        throw new Error('Unable to generate a link')
      }
      const subject = getSubject(linkType)
      const user = data.user
      const link = data.properties.action_link
      switch (linkType) {
        case 'signup': {
          const plainText =
            'Thank you for signing up for the GLA Summit Website. ' +
            'Please use this link to confirm your email address: ' +
            link
          let component = <></>
          if (type === 'signup') {
            const person = {
              firstName: bodyData.signUpData.data?.firstname ?? 'Unnamed',
              lastName: bodyData.signUpData.data?.lastname ?? 'User',
              email: bodyData.email
            }
            component = (
              <RegistrationEmail registrationLink={link} person={person} />
            )
          } else {
            // generateSupabaseLink changed from something other than signup to signup
            // This shouldn't happen...
            component = (
              <RegistrationEmail
                registrationLink={link}
                person={{
                  email: bodyData.email,
                  firstName: 'new',
                  lastName: 'user'
                }}
              />
            )
          }
          const { body, bodyPlain } = generateBody(component, plainText)
          return { body, bodyPlain, user, subject }
        }
        case 'magiclink': {
          const plainText =
            "Here's your sign-in link for the GLA Summit Website. " +
            'Please use this link to sign in: ' +
            link
          const { body, bodyPlain } = generateBody(
            <SignInEmail link={link} />,
            plainText
          )
          return { body, bodyPlain, user, subject }
        }
        default: {
          return { body: '', bodyPlain: '', user: null, subject }
        }
      }
    })
    .then(async ({ user, ...textParts }) => {
      return {
        status: await sendMailApi({
          to: bodyData.email,
          ...textParts
        }),
        user
      }
    })
    // .then(({ status, user }) => {
    .then(({ user }) => {
      // console.log({ status, user })
      // if (status.accepted.includes(bodyData.email)) {
      return res.status(201).json({ user, session: null, error: null })
      // } else {
      //   console.log('Error with mailing...')
      //   return res.status(500).json({
      //     user: null,
      //     session: null,
      //     error: 'Unable to deliver the mail'
      //   })
      // }
    })
    .catch((err) => {
      console.log({ err, m: 'In auth function, error finding user?' })
      if (err.message === 'User not found') {
        return res.status(401).json({ error: err })
      }
      return res.status(500).json(err)
    })
}

const getSubject = (type: LinkType) => {
  const subject =
    type === 'signup'
      ? 'GLA Summit 2022 Website Signup'
      : type === 'magiclink'
      ? 'GLA Summit 2022 Signin Link'
      : type === 'invite'
      ? 'GLA Summit 2022 Website Invitation'
      : type === 'recovery'
      ? 'GLA Summit 2022 Website - Password Recovery'
      : ''
  return subject
}

export default handler
