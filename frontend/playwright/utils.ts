import { IncomingMessage } from 'http';
import { networkInterfaces } from 'os';
import { request } from '@playwright/test';
import { InbucketAPIClient, MessageModel } from 'inbucket-js-client';

export type MessageAddress = {
  address: string;
  name: string;
};

export type Message = {
  _id: string;
  subject: string;
  links: string[];
  to: MessageAddress[];
  from: MessageAddress[];
  cc: MessageAddress[];
  bcc: MessageAddress[];
};

export const getInbucketEmail = async (email: string) => {
  const client = new InbucketAPIClient('http://localhost:54324/');
  const inbox = await client.mailbox(email);
  const message = await client.message(email, inbox[0].id);
  return message;
};

const getInbucketVerificationMsg = async (
  email: string,
  timeout: number = 3000
): Promise<MessageModel> => {
  if (timeout < 0) {
    return Promise.reject('Timeout');
  }

  const client = new InbucketAPIClient('http://localhost:54324/');
  return client
    .mailbox(email)
    .then((inbox) => client.message(email, inbox[0].id))
    .catch((e) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(getInbucketVerificationMsg(email, timeout - 500));
        }, 500);
      });
    });
};

export const getInbucketVerificationCode = async (
  email: string,
  timeout: number = 3000
) => {
  const mail = await getInbucketVerificationMsg(email, timeout);
  const { text, html } = mail.body;

  const textMatcher = /Your One-Time-Passcode \(OTP\) token is ([0-9]{6})/i;
  const matchGroups = text.match(textMatcher);
  const htmlMatcher = /<p.*>([0-9]{6})<\/p>/i;
  const htmlMatchGroups = html.match(htmlMatcher);

  const textOtp = matchGroups?.[1];
  const htmlOtp = htmlMatchGroups?.[1];

  if (typeof textOtp === 'undefined') {
    return Promise.reject('No verification code found');
  }
  if (textOtp !== htmlOtp) {
    return Promise.reject('Text and HTML verification codes do not match');
  }
  return textOtp;
};

const results = Object.create(null);
const nets = networkInterfaces();
for (const name of Object.keys(nets)) {
  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
  for (const net of nets[name]!) {
    const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
    if (net.family === familyV4Value && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
    }
  }
}

export const reqToBody = (
  req: IncomingMessage,
  callback: (body: string) => void
) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    callback(body);
  });
};

const getMailsacAPIContext = async () => {
  const mailboxApiKey = process.env['MAILSAC_API_KEY'] as string;

  const context = await request.newContext({
    baseURL: `https://mailsac.com/api/`,
    extraHTTPHeaders: {
      'Mailsac-Key': mailboxApiKey
    }
  });

  return context;
};

export const checkMailsacEmail = async (
  email: string,
  subject: string,
  counter: number = 0
): Promise<Message | null> => {
  const context = await getMailsacAPIContext();
  const response = await context.get(`addresses/${email}/messages`);
  const messages = (await response.json()) as Array<Message>;

  const message = messages.find((msg) => msg.subject === subject);

  if (typeof message === 'undefined') {
    return new Promise((resolve) => {
      if (counter < 5) {
        setTimeout(() => {
          resolve(checkMailsacEmail(email, subject, counter + 1));
        }, 1000);
      } else {
        return null;
      }
    });
  } else {
    return message;
  }
};

export const getMailsacEmailBody = async (email: string, id: string) => {
  const context = await getMailsacAPIContext();
  const response = await context.get(`text/${email}/${id}`);
  console.log({
    response,
    rtext: await response.text(),
    rbody: await response.body()
  });
  return await response.text();
};

export const localIP = results['eth0'][0];
