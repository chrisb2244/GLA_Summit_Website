import type { Database } from '@/lib/sb_databaseModels';
import { createClient } from '@supabase/supabase-js';
import { InbucketAPIClient, MessageModel } from 'inbucket-js-client';

// Setup an admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SECRET_SUPABASE_SERVICE_KEY as string;
export const createSupabaseAdmin = () =>
  createClient<Database>(supabaseUrl, supabaseKey);

export const getInbucketEmail = async (email: string) => {
  const client = new InbucketAPIClient('http://localhost:54324/');
  const inbox = await client.mailbox(email);
  const message = await client.message(email, inbox[0].id);
  return message;
};

const getInbucketVerificationMsg = async (
  email: string,
  timeout: number = 3000,
  sentWithin: number = 3000
): Promise<MessageModel> => {
  if (timeout < 0) {
    return Promise.reject('Timeout');
  }

  const client = new InbucketAPIClient('http://localhost:54324/');
  return client
    .mailbox(email)
    .then((inbox) => {
      const lastId = inbox.length > 0 ? inbox.length - 1 : 0;
      return client.message(email, inbox[lastId].id).then((msg) => {
        const sentTime = new Date(msg.date);
        if (sentTime.getTime() > Date.now() - sentWithin) {
          return msg;
        } else {
          console.log('Rejecting otp from : ', sentTime, msg.body.text);
          throw new Error('Message too old');
        }
      });
    })
    .catch((e) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(getInbucketVerificationMsg(email, timeout - 500, sentWithin));
        }, 500);
      });
    });
};

export const getInbucketVerificationCode = async (
  email: string,
  timeout: number = 3000,
  sentWithin: number = 3000
) => {
  const mail = await getInbucketVerificationMsg(email, timeout, sentWithin);
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
