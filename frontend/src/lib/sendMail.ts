import nodemailer from 'nodemailer'
import Mailgun from 'mailgun.js'
import FormDataPackage from 'form-data'
import type { Options } from 'nodemailer/lib/mailer'

const MG_API_KEY = process.env.MG_API_KEY as string // '339dfe857fa6977b54927a9f8eeb19ba-27a562f9-66d41400'
const MG_DOMAIN = process.env.MG_DOMAIN as string

const mailgun = new Mailgun(FormDataPackage)
const mg = mailgun.client({ username: 'api', key: MG_API_KEY, url: 'https://api.mailgun.net' })

export type EmailContent = {
  to: string | string[]
  subject: string
  bodyPlain: string
  body?: string
  from?: string
}

export const sendMail = async (emailContent: EmailContent) => {
  const { to, subject, body, bodyPlain } = emailContent
  const from = emailContent.from ?? process.env.EMAIL_FROM

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number.parseInt(process.env.EMAIL_SERVER_PORT ?? '465'),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD
    },
    ignoreTLS: true
  })

  const options: Options = { to, subject, from, text: bodyPlain, html: body }

  return transporter.sendMail(options)
}

export const sendMailApi = async (emailContent: EmailContent) => {
  const { to, subject, body, bodyPlain } = emailContent
  const from = emailContent.from ?? process.env.EMAIL_FROM_MG

  // console.log({ MG_API_KEY, MG_DOMAIN })
  // console.log(await mg.domains.list().catch(err => console.log(err)))
  // console.log(from)

  // console.log({ to, subject, html: body, text: bodyPlain, from })
  
  return mg.messages
    .create('mg.glasummit.org', {
      to: 'chrisb2244@gmail.com',
      subject: 'Test subject',
      text: 'This is a test email',
      from: 'web@glasummit.org'
    })
    .then((msg) => {
      console.log({msg, m: 'api fn'})
      return msg
    })
    .catch((err) => {
      console.log({err, m: 'api err'})
      return err
    })
}
