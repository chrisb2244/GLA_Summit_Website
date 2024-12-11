import type { Database } from '@/lib/sb_databaseModels';
import { Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { InbucketAPIClient, MessageModel } from 'inbucket-js-client';
import { LoginablePage } from './models/LoginablePage';

// Setup an admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SECRET_SUPABASE_SERVICE_KEY as string;
export const createSupabaseAdmin = () =>
  createClient<Database>(supabaseUrl, supabaseKey);

const inbucketUrl = 'http://localhost:54324';

export const countEmailsInInbox = async (email: string) => {
  const mailbox = email.split('@')[0];
  const client = new InbucketAPIClient(inbucketUrl);
  const inbox = await client.mailbox(mailbox);
  return inbox.length;
};

export const getInbucketEmail = async (
  mailbox: string,
  timeout: number = 3000,
  sentWithin: number = 3000
): Promise<MessageModel> => {
  if (timeout < 0) {
    return Promise.reject('Timeout');
  }

  const client = new InbucketAPIClient(inbucketUrl);
  return client
    .mailbox(mailbox)
    .then((inbox) => {
      const lastId = inbox.length > 0 ? inbox.length - 1 : 0;
      return client.message(mailbox, inbox[lastId].id).then((msg) => {
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
          resolve(getInbucketEmail(mailbox, timeout - 500, sentWithin));
        }, 500);
      });
    });
};

export const getInbucketVerificationCode = async (
  email: string,
  timeout: number = 3000,
  sentWithin: number = 3000
) => {
  const mailbox = email.split('@')[0];
  const mail = await getInbucketEmail(mailbox, timeout, sentWithin);
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

export const loginOnPage = async (page: Page, email: string) => {
  const loginablePage = new LoginablePage(page);
  await loginablePage.openLoginOrRegisterForm('login');
  await loginablePage.fillInLoginForm(email);
  await loginablePage
    .submitForm()
    // Delay to allow the email to be sent - old emails exist for existing accounts
    .then(() => new Promise((resolve) => setTimeout(resolve, 500)));

  const otp = await getInbucketVerificationCode(email, 5000, 5000);
  await loginablePage.fillInVerificationForm(otp);
  await loginablePage.submitForm();

  // Assert the user menu button is populated
  const userButton = page.locator('[data-testid="user-menu-button"]');
  await userButton.waitFor({ state: 'visible', timeout: 2000 });
};
