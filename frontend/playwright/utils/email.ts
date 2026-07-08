import {
  InbucketAPIClient,
  MessageModel as InbucketMessage
} from 'inbucket-js-client';
import { ClientError, GraphQLClient } from '@testmail.app/graphql-request';

// HTTP API of the local mail catcher (Mailpit/Supabase Inbucket) that the tests
// READ delivered mail from. Distinct from the SMTP send target the app uses in
// mock mode (MAILPIT_SMTP_URL in src/lib/sendMail.ts). The default port (…324)
// is the API port, not the SMTP port (…325).
const localMailApiUrl =
  process.env.MAILPIT_API_URL ?? 'http://localhost:54324';

// ── Backend-agnostic message shape ───────────────────────────────────────────
//
// Both Mailpit and testmail.app are normalized into this type. Only the fields
// every backend can supply are required; backend-specific extras are optional
// so a filter can opt into them (e.g. testmail's exact `tag`, numeric
// `timestamp`, or `spamScore`) without every source having to provide them.
export type TestEmailMessage = {
  // Stable identifier for the message within its backend.
  id: string;
  // ISO-8601 send time. Use `timestamp` for the raw epoch when present.
  date: string;
  subject: string;
  from: string;
  body: {
    text: string;
    html: string;
  };
  // Recipient addresses
  to: string[];
  // Send time as epoch milliseconds (testmail.app provides this directly).
  timestamp?: number;
  // testmail.app spam score, when requested.
  spamScore?: number;
};

// ── testmail.app ────────────────────────────────────────────────────────────
//
// When TESTMAIL_NAMESPACE is set, email lookups go through the testmail.app
// GraphQL API instead of the local Mailpit/Inbucket inbox. This lets the same
// specs run against a deployed site whose real emails are addressed to
// "{namespace}.{tag}@inbox.testmail.app". When the variable is unset we fall
// back to the local namespace "test"; those addresses still resolve as Mailpit
// mailboxes when the app mocks email delivery locally, so the spec files do not
// have to change either way.
const testmailNamespace = process.env.TESTMAIL_NAMESPACE;
const testmailApiKey = process.env.TESTMAIL_API_KEY;
const testmailGraphqlUrl = 'https://api.testmail.app/api/graphql';
const testmailDomain = 'inbox.testmail.app';

// Namespace used to build generated addresses. Real testmail namespace when set,
// otherwise a stable local placeholder.
const emailNamespace = testmailNamespace ?? 'test';

// Email fetching uses the testmail.app API only when an actual namespace is
// configured; otherwise it uses the local inbox.
const useTestmail = (): boolean => Boolean(testmailNamespace);

// Build an address of the form "{namespace}.{tag}@inbox.testmail.app". The tag
// is generated the same way the previous local addresses were: a caller prefix
// followed by a time- and random-based unique suffix.
export const generateTestEmail = (prefix: string): string => {
  const unique = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  return `${emailNamespace}.${prefix}-${unique}@${testmailDomain}`;
};

const getMailboxFromEmail = (email: string) =>
  email.split('@')[0].toLowerCase();

// Derive the testmail tag from an address (or a bare mailbox/local part). The
// local part is "{namespace}.{tag}"; the namespace never contains a dot, so the
// tag is everything after the first dot.
const getTagFromEmail = (emailOrMailbox: string): string => {
  const localPart = getMailboxFromEmail(emailOrMailbox);
  const firstDot = localPart.indexOf('.');
  return firstDot === -1 ? localPart : localPart.slice(firstDot + 1);
};

const matchesMailbox = (address: string, mailbox: string) => {
  const localPart = getMailboxFromEmail(address);
  return localPart === mailbox.toLowerCase();
};

// ── testmail.app GraphQL ──────────────────────────────────────────────────────

type TestmailEmail = {
  from: string;
  subject: string;
  html: string | null;
  text: string | null;
  tag: string;
  // Unix timestamp in milliseconds.
  timestamp: number;
  spam_score: number | null;
};

type TestmailInboxData = {
  inbox: {
    result: string;
    count: number;
    emails: TestmailEmail[];
  };
};

// The inbox query, optionally as a live query. With livequery the request
// blocks server-side until at least one email matches (or returns immediately
// if matches already exist), so callers learn of a new email the instant it
// lands instead of polling. See waitForTestmailEmails for how the server-side
// hold and its periodic 307 self-redirect are bounded.
const testmailInboxQuery = (livequery: boolean = false): string => `
  query Inbox($namespace: String!, $tag: String!, $timestamp_from: Float) {
    inbox(
      namespace: $namespace
      tag: $tag
      timestamp_from: $timestamp_from
      ${livequery ? 'livequery: true' : ''}
    ) {
      result
      count
      emails {
        from
        subject
        html
        text
        tag
        timestamp
        spam_score
      }
    }
  }
`;

// testmail.app's GraphQL client — a fork of graphql-request with built-in
// retry/backoff. Created lazily so a missing API key only fails when the
// testmail backend is actually used. The retries cover transient API failures
// (rate limiting, 5xx, dropped connections) that the caller-level polling loops
// do not handle on their own.
let testmailClient: GraphQLClient | null = null;
const getTestmailClient = (): GraphQLClient => {
  if (!testmailApiKey) {
    throw new Error(
      '[testmail] TESTMAIL_NAMESPACE is set but TESTMAIL_API_KEY is not; cannot query the testmail.app API'
    );
  }
  if (!testmailClient) {
    testmailClient = new GraphQLClient(testmailGraphqlUrl, {
      headers: { Authorization: `Bearer ${testmailApiKey}` },
      retries: 3,
      retryDelay: (attempt) => 2 ** attempt * 250,
      retryOn: [429, 500, 502, 503, 504]
    });
  }
  return testmailClient;
};

const queryTestmailInbox = async (
  tag: string,
  timestampFrom: number = 0
): Promise<TestmailEmail[]> => {
  try {
    const data = await getTestmailClient().request<TestmailInboxData>(
      testmailInboxQuery(),
      { namespace: testmailNamespace, tag, timestamp_from: timestampFrom }
    );
    return data.inbox?.emails ?? [];
  } catch (error) {
    // The client throws ClientError for GraphQL errors and non-2xx responses;
    // surface a concise, prefixed message instead of its full response dump.
    if (error instanceof ClientError) {
      const graphqlErrors = error.response.errors
        ?.map((graphqlError) => graphqlError.message)
        .join('; ');
      throw new Error(
        `[testmail] request failed (status ${error.response.status})${
          graphqlErrors ? `: ${graphqlErrors}` : ''
        }`
      );
    }
    throw error;
  }
};

const fromTestmail = (email: TestmailEmail): TestEmailMessage => ({
  id: `${email.tag}-${email.timestamp}`,
  date: new Date(email.timestamp).toISOString(),
  subject: email.subject,
  from: email.from,
  body: {
    text: email.text ?? '',
    html: email.html ?? ''
  },
  // testmail doesn't return a recipient, so rebuild the address from the tag:
  // "{namespace}.{tag}@inbox.testmail.app" is exactly where the email was sent.
  to: [`${emailNamespace}.${email.tag}@${testmailDomain}`],
  timestamp: email.timestamp,
  spamScore: email.spam_score ?? undefined
});

// Block until at least one email to `tag` (sent at or after `sentAfter`)
// satisfies every condition, then resolve to all matching messages. Uses
// testmail's livequery, so the request returns the instant a matching email
// lands instead of polling.
//
// There is no internal timeout: testmail holds each request open for up to a
// minute, then 307-redirects to itself (which node-fetch auto-follows), so a
// missing email simply keeps the request pending — which is the "set a timeout
// in your test suite" the testmail docs call for. The Playwright per-test
// timeout provides exactly that bound, well before node-fetch's redirect-follow
// limit is reached.
const waitForTestmailEmails = async (
  tag: string,
  conditions: EmailCondition[],
  sentAfter: number
): Promise<TestEmailMessage[]> => {
  // Advance past emails we've already seen and rejected, so a re-issued live
  // query blocks for newer mail instead of returning the same batch at once.
  let anchor = sentAfter;

  for (;;) {
    const data = await getTestmailClient().request<TestmailInboxData>(
      testmailInboxQuery(true),
      { namespace: testmailNamespace, tag, timestamp_from: anchor }
    );
    const emails = data.inbox?.emails ?? [];
    const matched = emails
      .map(fromTestmail)
      .filter((message) => conditions.every((condition) => condition(message)));
    if (matched.length > 0) return matched;

    anchor =
      emails.reduce(
        (newest, email) => Math.max(newest, email.timestamp),
        anchor - 1
      ) + 1;
  }
};

// ── Mailpit ───────────────────────────────────────────────────────────────────

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

const fromMailpit = (message: MailpitMessageDetail): TestEmailMessage => ({
  id: message.ID,
  date: message.Date,
  subject: message.Subject,
  from: message.From.Address,
  body: {
    text: message.Text,
    html: message.HTML
  },
  to: (message.To ?? []).map((recipient) => recipient.Address)
});

const fromInbucket = (message: InbucketMessage): TestEmailMessage => ({
  id: message.id,
  date: message.date,
  subject: message.subject,
  from: message.from,
  body: {
    text: message.body?.text ?? '',
    html: message.body?.html ?? ''
  },
  to: message.header?.To ?? []
});

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

const listMailpitMessagesForMailbox = async (
  mailbox: string
): Promise<TestEmailMessage[]> => {
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
  return details.map(fromMailpit);
};

const getLatestInbucketMessageForMailbox = async (
  mailbox: string
): Promise<TestEmailMessage> => {
  const client = new InbucketAPIClient(localMailApiUrl);
  const inbox = await client.mailbox(mailbox);
  if (inbox.length === 0) {
    throw new Error(`[inbucket] no messages found for mailbox: ${mailbox}`);
  }
  const lastId = inbox.length - 1;
  return fromInbucket(await client.message(mailbox, inbox[lastId].id));
};

// ── Backend-agnostic listing ──────────────────────────────────────────────────

// Return all messages sent to the given email address (and, for testmail, sent
// at or after `sentAfter`) as normalized TestEmailMessages, sourced from
// whichever backend is configured. The address is converted to the form each
// service needs: a tag for testmail, a mailbox (local part) for Mailpit.
const listMessages = async (
  email: string,
  sentAfter: number = 0
): Promise<TestEmailMessage[]> => {
  if (useTestmail()) {
    const emails = await queryTestmailInbox(getTagFromEmail(email), sentAfter);
    return emails.map(fromTestmail);
  }
  return listMailpitMessagesForMailbox(getMailboxFromEmail(email));
};

export const getLatestMessageForEmail = async (
  email: string
): Promise<TestEmailMessage> => {
  if (useTestmail()) {
    const messages = await listMessages(email);
    if (messages.length === 0) {
      throw new Error(
        `[testmail] no messages found for tag: ${getTagFromEmail(email)}`
      );
    }
    return messages.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  }

  const mailbox = getMailboxFromEmail(email);
  try {
    const messages = await listMailpitMessagesForMailbox(mailbox);
    if (messages.length === 0) {
      throw new Error(`[mailpit] no messages found for mailbox: ${mailbox}`);
    }
    return messages[0];
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
  if (useTestmail()) {
    const messages = await listMessages(email);
    return messages.length;
  }

  const mailbox = getMailboxFromEmail(email);
  try {
    return (await listMailpitMessagesForMailbox(mailbox)).length;
  } catch {
    const client = new InbucketAPIClient(localMailApiUrl);
    const inbox = await client.mailbox(mailbox);
    return inbox.length;
  }
};

type EmailCondition = (message: TestEmailMessage) => boolean;

const getEmailsWithConditions = async (
  email: string,
  conditions: EmailCondition[],
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
): Promise<TestEmailMessage[]> => {
  const messages = await listMessages(email, sentAfter);
  return messages.filter((message) => {
    const sentTime = new Date(message.date).getTime();
    const isRecent = sentTime >= sentAfter;
    const meetsConditions =
      conditions.length === 0 ||
      conditions.every((condition) => condition(message));
    return isRecent && meetsConditions;
  });
};

export const getEmailsWithSubject = (
  email: string,
  subject: string,
  sentAfter: number = 0
): Promise<TestEmailMessage[]> =>
  getEmailsWithConditions(
    email,
    [(message) => message.subject === subject],
    sentAfter
  );

export const getInbucketVerificationCode = async (
  email: string,
  timeout: number = 3000,
  lookbackMs: number = 3000
): Promise<string> => {
  // Supabase OTPs are 6 digits locally but 8 digits in production; accept either.
  // Longer alternative goes first so an 8-digit code isn't truncated to its first 6.
  const otpMatcher =
    /(?:one[-\s]?time[-\s]?passcode\s*(?:\(otp\))?\s*token\s*is:?|\botp\b[^\d]*)([0-9]{8}|[0-9]{6})/i;
  const otpDigits = /\b([0-9]{8}|[0-9]{6})\b/;

  const tryExtract = (mail: TestEmailMessage): string | null => {
    const text = mail.body.text ?? '';
    const html = mail.body.html ?? '';
    const textOtp = text.match(otpMatcher)?.[1] ?? text.match(otpDigits)?.[1];
    const htmlOtp = html.match(otpMatcher)?.[1] ?? html.match(otpDigits)?.[1];
    if (typeof textOtp === 'undefined') return null;
    if (htmlOtp && textOtp !== htmlOtp) return null;
    return textOtp;
  };

  const extractNewest = (candidates: TestEmailMessage[]): string | null => {
    const newestFirst = candidates.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    for (const mail of newestFirst) {
      const otp = tryExtract(mail);
      if (otp) return otp;
    }
    return null;
  };

  // Anchor the lower bound once, lookbackMs before we start polling, to cover the
  // OTP email that was just triggered. Captured outside the loop so it does not
  // slide forward on each iteration and skip a code that arrived early.
  const sentAfter = Date.now() - lookbackMs;

  // On testmail, block on a live query so the code is returned the instant it
  // lands; the wait condition is the strict extraction itself, so it only
  // resolves on an email a code can actually be read from. The overall wait is
  // bounded by the Playwright test timeout rather than `timeout`.
  if (useTestmail()) {
    const candidates = await waitForTestmailEmails(
      getTagFromEmail(email),
      [(mail) => tryExtract(mail) !== null],
      sentAfter
    );
    return (
      extractNewest(candidates) ?? Promise.reject('No verification code found')
    );
  }

  // Mailpit has no blocking endpoint, so poll snapshots until the deadline.
  const deadline = Date.now() + timeout;
  while (Date.now() <= deadline) {
    const candidates = await getEmailsWithConditions(
      email,
      [
        (msg) =>
          otpDigits.test(msg.body.text ?? '') ||
          otpDigits.test(msg.body.html ?? '')
      ],
      sentAfter
    );
    const otp = extractNewest(candidates);
    if (otp) return otp;
    if (Date.now() >= deadline) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return Promise.reject('No verification code found');
};
