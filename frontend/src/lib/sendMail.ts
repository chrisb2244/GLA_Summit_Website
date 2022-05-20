import nodemailer from 'nodemailer'
import type { Options } from 'nodemailer/lib/mailer'

export type EmailContent = {
  to: string
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
    }
  })

  const options: Options = { to, subject, from, text: bodyPlain, html: body }

  return transporter.sendMail(options)
}
