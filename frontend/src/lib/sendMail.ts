import 'server-only';
import type { MessagesSendResult } from 'mailgun.js';

export type EmailContent = {
  to: string | string[];
  subject: string;
  bodyPlain: string;
  body?: string;
  from?: string;
};

type SendMailFn = (emailContent: EmailContent) => Promise<MessagesSendResult>;

// Mock mode: deliver locally over SMTP. nodemailer is a devDependency,
// and the dynamic import keeps it out of the production server's module graph.
const createMockSender = async (): Promise<SendMailFn> => {
  const { createTransport } = await import('nodemailer');

  // SMTP endpoint of the local mail catcher (Mailpit/Supabase Inbucket) that
  // receives mock-mode mail. This is the SEND target — distinct from the HTTP
  // API the tests read from (MAILPIT_API_URL in playwright/utils/email.ts). The
  // default port (…325) is the SMTP port, not the API port (…324).
  const smtpUrl = new URL(
    process.env.MAILPIT_SMTP_URL || 'http://127.0.0.1:54325'
  );
  const smtpPort = parseInt(smtpUrl.port, 10);

  const nmail = createTransport({
    host: smtpUrl.hostname,
    port: smtpPort,
    secure: false
  });

  return async (emailContent) => {
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
};

const createMailgunSender = async (): Promise<SendMailFn> => {
  const [mailgunModule, { default: FormDataPackage }] = await Promise.all([
    import('mailgun.js'),
    import('form-data')
  ]);
  // mailgun.js is CommonJS (module.exports = Mailgun), so under node16 module
  // resolution `.default` is typed as the whole module. The class re-exposes
  // itself as a static `default`, which resolves to the class under every
  // interop (Node, Turbopack) and is typed correctly.
  const Mailgun = mailgunModule.default.default;

  const MG_API_KEY = process.env.MAILGUN_SENDING_KEY as string;

  const mailgun = new Mailgun(FormDataPackage);
  const mg = mailgun.client({
    username: 'api',
    key: MG_API_KEY,
    url: 'https://api.mailgun.net'
  });

  return async (emailContent) => {
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
      .catch((err) => {
        const response: MessagesSendResult = {
          status: 500,
          message: err,
          details: 'Some error occurred when trying to send mail'
        };
        return response;
      });
  };
};

// Built on first send and reused.
let sender: Promise<SendMailFn> | undefined;

const getSender = (): Promise<SendMailFn> => {
  sender ??= (
    process.env.USE_MOCK_EMAIL === 'true'
      ? createMockSender()
      : createMailgunSender()
  ).catch((err: unknown) => {
    sender = undefined;
    throw err;
  });
  return sender;
};

export const sendMailApi: SendMailFn = async (emailContent) => {
  const send = await getSender();
  return send(emailContent);
};
