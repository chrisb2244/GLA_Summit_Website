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

const localMailApiUrl =
  process.env.TEST_MAIL_API_URL ?? 'http://localhost:54324';

type MailpitMessageSummary = {
  ID: string;
  Created: string;
  To: Array<{ Address: string }>;
};

type MailpitMessagesResponse = {
  messages: MailpitMessageSummary[];
};

type MailpitMessageDetail = {
  ID: string;
  Date: string;
  Text: string;
  HTML: string;
  Subject: string;
  ReturnPath: string;
  From: { Name: string; Address: string };
  To: Array<{ Name: string; Address: string }>;
};

const getMailboxFromEmail = (email: string) =>
  email.split('@')[0].toLowerCase();

const matchesMailbox = (address: string, mailbox: string) => {
  const localPart = getMailboxFromEmail(address);
  return localPart === mailbox.toLowerCase();
};

const toMessageModel = (mailpitMessage: MailpitMessageDetail): MessageModel =>
  ({
    id: mailpitMessage.ID,
    date: mailpitMessage.Date,
    body: {
      text: mailpitMessage.Text,
      html: mailpitMessage.HTML
    },
    subject: mailpitMessage.Subject,
    from: mailpitMessage.From.Address
  }) as MessageModel;

const listMailpitMessages = async (): Promise<MailpitMessagesResponse> => {
  const response = await fetch(`${localMailApiUrl}/api/v1/messages`);
  if (!response.ok) {
    throw new Error(
      `[mailpit] request error: ${response.status} ${await response.text()}`
    );
  }
  return response.json() as Promise<MailpitMessagesResponse>;
};

const getMailpitMessage = async (id: string): Promise<MailpitMessageDetail> => {
  const response = await fetch(`${localMailApiUrl}/api/v1/message/${id}`);
  if (!response.ok) {
    throw new Error(
      `[mailpit] request error: ${response.status} ${await response.text()}`
    );
  }
  return response.json() as Promise<MailpitMessageDetail>;
};

const getLatestMailpitMessageForMailbox = async (
  mailbox: string
): Promise<MessageModel> => {
  const messagesResponse = await listMailpitMessages();
  const matched = (messagesResponse.messages ?? []).find((message) =>
    (message.To ?? []).some((recipient) =>
      matchesMailbox(recipient.Address, mailbox)
    )
  );

  if (!matched) {
    throw new Error(`[mailpit] no messages found for mailbox: ${mailbox}`);
  }

  const message = await getMailpitMessage(matched.ID);
  return toMessageModel(message);
};

const countMailpitEmailsInInbox = async (mailbox: string): Promise<number> => {
  const messagesResponse = await listMailpitMessages();
  return (messagesResponse.messages ?? []).filter((message) =>
    (message.To ?? []).some((recipient) =>
      matchesMailbox(recipient.Address, mailbox)
    )
  ).length;
};

const getLatestInbucketMessageForMailbox = async (
  mailbox: string
): Promise<MessageModel> => {
  const client = new InbucketAPIClient(localMailApiUrl);
  const inbox = await client.mailbox(mailbox);
  if (inbox.length === 0) {
    throw new Error(`[inbucket] no messages found for mailbox: ${mailbox}`);
  }
  const lastId = inbox.length - 1;
  return client.message(mailbox, inbox[lastId].id);
};

const getLatestMessageForMailbox = async (
  mailbox: string
): Promise<MessageModel> => {
  try {
    return await getLatestMailpitMessageForMailbox(mailbox);
  } catch (mailpitError) {
    // Backward compatibility for environments still running Inbucket APIs.
    return getLatestInbucketMessageForMailbox(mailbox).catch(
      (inbucketError) => {
        throw new Error(
          `Failed to fetch mailbox ${mailbox} from Mailpit and Inbucket. Mailpit error: ${String(
            mailpitError
          )}. Inbucket error: ${String(inbucketError)}`
        );
      }
    );
  }
};

export const countEmailsInInbox = async (email: string) => {
  const mailbox = getMailboxFromEmail(email);
  try {
    return await countMailpitEmailsInInbox(mailbox);
  } catch {
    const client = new InbucketAPIClient(localMailApiUrl);
    const inbox = await client.mailbox(mailbox);
    return inbox.length;
  }
};

const getEmailsWithConditions = async (
  mailbox: string,
  conditions: Array<(message: MailpitMessageDetail) => boolean>,
  // Absolute lower bound (epoch ms) on the email's send time; messages sent
  // before this are ignored. Defaults to 0 (no lower bound).
  //
  // This MUST be an absolute timestamp captured once, before the email is
  // triggered — never a relative "sent within the last N ms". A relative window
  // is recomputed from Date.now() on every call, so inside an expect(...).toPass()
  // retry loop it slides forward in time and walks off the end of an
  // already-delivered email: once the email is older than the window, retrying
  // only makes it staler and it can never match. A fixed anchor stays put.
  sentAfter: number = 0
): Promise<MessageModel[]> => {
  const messagesResponse = await listMailpitMessages();
  const summariesToMailbox = (messagesResponse.messages ?? []).filter(
    (message) =>
      (message.To ?? []).some((recipient) =>
        matchesMailbox(recipient.Address, mailbox)
      )
  );
  const details = await Promise.all(
    summariesToMailbox.map((msg) => getMailpitMessage(msg.ID))
  );
  const matched = details.filter((message) => {
    const sentTime = new Date(message.Date);
    const isRecent = sentTime.getTime() >= sentAfter;
    const meetsConditions =
      conditions.length === 0 || conditions.every((cond) => cond(message));
    return isRecent && meetsConditions;
  });
  return matched.map(toMessageModel);
};

export const getEmailsWithSubject = (
  mailbox: string,
  subject: string,
  sentAfter: number = 0
): Promise<MessageModel[]> =>
  getEmailsWithConditions(
    mailbox,
    [(message) => message.Subject === subject],
    sentAfter
  );

export const getInbucketVerificationCode = async (
  email: string,
  timeout: number = 3000,
  lookbackMs: number = 3000
): Promise<string> => {
  const mailbox = getMailboxFromEmail(email);
  // Supabase OTPs are 6 digits locally but 8 digits in production; accept either.
  // Longer alternative goes first so an 8-digit code isn't truncated to its first 6.
  const otpMatcher =
    /(?:one[-\s]?time[-\s]?passcode\s*(?:\(otp\))?\s*token\s*is:?|\botp\b[^\d]*)([0-9]{8}|[0-9]{6})/i;
  const otpDigits = /\b([0-9]{8}|[0-9]{6})\b/;

  const tryExtract = (mail: MessageModel): string | null => {
    const text = mail.body?.text ?? '';
    const html = mail.body?.html ?? '';
    const textOtp = text.match(otpMatcher)?.[1] ?? text.match(otpDigits)?.[1];
    const htmlOtp = html.match(otpMatcher)?.[1] ?? html.match(otpDigits)?.[1];
    if (typeof textOtp === 'undefined') return null;
    if (htmlOtp && textOtp !== htmlOtp) return null;
    return textOtp;
  };

  // Anchor the lower bound once, lookbackMs before we start polling, to cover the
  // OTP email that was just triggered. Captured outside the loop so it does not
  // slide forward on each iteration and skip a code that arrived early.
  const sentAfter = Date.now() - lookbackMs;
  const deadline = Date.now() + timeout;
  while (Date.now() <= deadline) {
    const candidates = await getEmailsWithConditions(
      mailbox,
      [
        (msg) =>
          otpDigits.test(msg.Text ?? '') || otpDigits.test(msg.HTML ?? '')
      ],
      sentAfter
    );
    const newestFirst = candidates.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    for (const mail of newestFirst) {
      const otp = tryExtract(mail);
      if (otp) return otp;
    }
    if (Date.now() >= deadline) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return Promise.reject('No verification code found');
};

type LoginOnPageOptions = {
  expectedPath?: string | RegExp;
  redirectTimeoutMs?: number;
};

export const loginOnPage = async (
  page: Page,
  email: string,
  options?: LoginOnPageOptions
) => {
  const loginablePage = new LoginablePage(page);
  await loginablePage.openLoginOrRegisterForm('login');
  await loginablePage.fillInLoginForm(email);
  await loginablePage
    .submitForm()
    // Delay to allow the email to be sent - old emails exist for existing accounts
    .then(() => new Promise((resolve) => setTimeout(resolve, 300)));

  const otp = await getInbucketVerificationCode(email, 5000, 3000);
  await loginablePage.fillInVerificationForm(otp);
  await loginablePage.submitForm();

  // Assert the user menu button is populated
  const userButton = page.locator('[data-testid="user-menu-button"]');
  await userButton.waitFor({ state: 'visible', timeout: 5000 });

  // For redirect-sensitive tests, wait until the expected destination route settles.
  // domcontentloaded (not 'load') avoids blocking on streaming Suspense boundaries.
  if (options?.expectedPath !== undefined) {
    await page.waitForURL(options.expectedPath, {
      timeout: options.redirectTimeoutMs ?? 15000,
      waitUntil: 'domcontentloaded'
    });
  }
};

type SharedPresentationSeedOptions = {
  title: string;
  year: Database['public']['Enums']['summit_year'];
  submitterEmail: string;
  copresenterEmail: string;
  status: 'accepted' | 'awaiting-response';
  isSubmitted?: boolean;
};

export const deletePresentationByTitle = async (
  title: string,
  submitterEmail: string
) => {
  const admin = createSupabaseAdmin();
  const { data: emailLookup } = await admin
    .from('email_lookup')
    .select('id')
    .eq('email', submitterEmail)
    .maybeSingle();

  if (!emailLookup?.id) {
    return;
  }

  await admin
    .from('presentation_submissions')
    .delete()
    .eq('submitter_id', emailLookup.id)
    .eq('title', title);
};

export const seedSharedPresentation = async (
  options: SharedPresentationSeedOptions
) => {
  const admin = createSupabaseAdmin();
  const { title, year, submitterEmail, copresenterEmail, status } = options;
  const isSubmitted = options.isSubmitted ?? true;

  const { data: users, error: userLookupError } = await admin
    .from('email_lookup')
    .select('id, email')
    .in('email', [submitterEmail, copresenterEmail]);

  if (userLookupError) {
    throw new Error(`Failed to look up test users: ${userLookupError.message}`);
  }

  const submitter = users?.find((u) => u.email === submitterEmail);
  const copresenter = users?.find((u) => u.email === copresenterEmail);
  if (!submitter || !copresenter) {
    throw new Error(
      'Could not find submitter/copresenter test users in email_lookup'
    );
  }

  const { data: presentation, error: presentationError } = await admin
    .from('presentation_submissions')
    .insert({
      title,
      abstract:
        'Shared presentation abstract used for copresenter visibility tests.',
      learning_points:
        'Shared learning points used for copresenter visibility and status tests.',
      submitter_id: submitter.id,
      year,
      is_submitted: isSubmitted,
      presentation_type: 'full length'
    })
    .select('id')
    .single();

  if (presentationError || !presentation) {
    throw new Error(
      `Failed to create shared presentation: ${
        presentationError?.message ?? 'unknown error'
      }`
    );
  }

  const presentationId = presentation.id;

  const { error: presenterLinkError } = await admin
    .from('presentation_presenters')
    .insert([
      { presentation_id: presentationId, presenter_id: submitter.id },
      { presentation_id: presentationId, presenter_id: copresenter.id }
    ]);

  if (presenterLinkError) {
    await admin
      .from('presentation_submissions')
      .delete()
      .eq('id', presentationId);
    throw new Error(
      `Failed to link shared presentation presenters: ${presenterLinkError.message}`
    );
  }

  if (status === 'accepted') {
    const { error: acceptedInsertError } = await admin
      .from('accepted_presentations')
      .insert({ id: presentationId, year });
    if (acceptedInsertError) {
      await admin
        .from('presentation_submissions')
        .delete()
        .eq('id', presentationId);
      throw new Error(
        `Failed to set accepted status for shared presentation: ${acceptedInsertError.message}`
      );
    }
  }

  return {
    presentationId,
    title,
    submitterId: submitter.id,
    copresenterId: copresenter.id,
    cleanup: async () => {
      await admin
        .from('accepted_presentations')
        .delete()
        .eq('id', presentationId);
      await admin
        .from('rejected_presentations')
        .delete()
        .eq('id', presentationId);
      await admin
        .from('presentation_submissions')
        .delete()
        .eq('id', presentationId);
    }
  };
};
