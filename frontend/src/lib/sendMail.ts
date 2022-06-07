// import nodemailer from 'nodemailer'
import Mailgun from 'mailgun.js'
import FormDataPackage from 'form-data'
// import type { Options } from 'nodemailer/lib/mailer'

const MG_API_KEY = process.env.MG_API_KEY as string

const mailgun = new Mailgun(FormDataPackage)
const mg = mailgun.client({ username: 'api', key: MG_API_KEY, url: 'https://api.mailgun.net' })

export type EmailContent = {
  to: string | string[]
  subject: string
  bodyPlain: string
  body?: string
  from?: string
}

// export const sendMail = async (emailContent: EmailContent) => {
//   const { to, subject, body, bodyPlain } = emailContent
//   const from = emailContent.from ?? process.env.EMAIL_FROM

//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_SERVER_HOST,
//     port: Number.parseInt(process.env.EMAIL_SERVER_PORT ?? '465'),
//     auth: {
//       user: process.env.EMAIL_SERVER_USER,
//       pass: process.env.EMAIL_SERVER_PASSWORD
//     },
//     ignoreTLS: true
//   })

//   const options: Options = { to, subject, from, text: bodyPlain, html: body }

//   return transporter.sendMail(options)
// }

export const sendMailApi = async (emailContent: EmailContent) => {
  const { to, subject, body, bodyPlain } = emailContent
  const from = emailContent.from ?? process.env.EMAIL_FROM_MG

  return mg.messages
    .create('mg.glasummit.org', {to, subject, text: bodyPlain, html: body, from})
    .then((msg) => {
      return msg
    })
    .catch((err) => {
      return err
    })
}
