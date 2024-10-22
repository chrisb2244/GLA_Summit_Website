import type { MessagesSendResult } from 'mailgun.js';

export type EmailContent = {
  to: string | string[];
  subject: string;
  bodyPlain: string;
  body?: string;
  from?: string;
};

let sendMailApi: (emailContent: EmailContent) => Promise<MessagesSendResult>;

if (process.env.USE_MOCK_EMAIL === 'true') {
  /* eslint-disable-next-line @typescript-eslint/no-require-imports */
  const mailer = require('nodemailer') as typeof import('nodemailer');
  const nmail = mailer.createTransport({
    host: '127.0.0.1',
    port: 54325,
    secure: false
  });

  sendMailApi = async (emailContent: EmailContent) => {
    const { to, subject, body, bodyPlain } = emailContent;
    const from = emailContent.from ?? process.env.EMAIL_FROM_MG;
    const sentMessageInfo = await nmail.sendMail({
      to,
      subject,
      text: bodyPlain,
      html: body,
      from
    });

    return {
      status: sentMessageInfo.accepted.length > 0 ? 200 : 500,
      message: sentMessageInfo.response
    };
  };
} else {
  /* eslint-disable-next-line @typescript-eslint/no-require-imports */
  const Mailgun = require('mailgun.js') as typeof import('mailgun.js').default;
  /* eslint-disable-next-line @typescript-eslint/no-require-imports */
  const FormDataPackage = require('form-data') as typeof import('form-data');

  const MG_API_KEY = process.env.MG_API_KEY as string;

  const mailgun = new Mailgun(FormDataPackage);
  const mg = mailgun.client({
    username: 'api',
    key: MG_API_KEY,
    url: 'https://api.mailgun.net'
  });

  sendMailApi = async (emailContent: EmailContent) => {
    const { to, subject, body, bodyPlain } = emailContent;
    const from = emailContent.from ?? process.env.EMAIL_FROM_MG;

    return mg.messages
      .create('mg.glasummit.org', {
        to,
        subject,
        text: bodyPlain,
        html: body,
        from
      })
      .then((msg) => {
        return msg;
      })
      .catch((err) => {
        const response: MessagesSendResult = {
          status: 500,
          message: err,
          details: 'Some error occurred when trying to send mail'
        };
        return response;
      });
  };
}

export { sendMailApi };
