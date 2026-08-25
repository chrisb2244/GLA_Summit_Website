import 'server-only';

import { createHash, randomInt } from 'crypto';

import {
  AddressAddedNoticeEmailFn,
  addressAddedNoticeEmailText,
  AddressVerificationEmailFn,
  addressVerificationEmailText
} from '@/EmailTemplates/AddressVerificationEmail';
import { sendMailApi } from '@/lib/sendMail';
import { createAdminClient } from '@/lib/supabaseClient';
import { joinNames, logToDb } from '@/lib/utils';
import { after } from 'next/server';

/** How long a confirmation code is good for. */
const CODE_LIFETIME_MS = 15 * 60 * 1000;
/** Wrong guesses tolerated per claim before it is burned. */
const MAX_ATTEMPTS = 5;
/** Claims a user may open per hour, across all addresses. */
const MAX_CLAIMS_PER_HOUR = 5;

export type AccountAddress = {
  email: string;
  isPrimary: boolean;
  addedAt: string;
};

/**
 * The code is stored only as a digest, salted with the account id so a digest
 * lifted from one row cannot be replayed against another.
 */
const hashCode = (userId: string, code: string) =>
  createHash('sha256').update(`${userId}:${code}`).digest('hex');

const normalise = (email: string) => email.trim().toLowerCase();

/**
 * The account's addresses, or null if they could not be read.
 *
 * Throwing would take down the entire profile page, which is undesireable.
 */
export const listAccountAddresses = async (
  userId: string
): Promise<AccountAddress[] | null> => {
  const { data, error } = await createAdminClient()
    .from('account_emails')
    .select('email, is_primary, added_at')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('added_at', { ascending: true });

  if (error) {
    after(() =>
      logToDb('error', 'Failed to list account addresses', 'profile/emails', {
        userId,
        context: { message: error.message, code: error.code }
      })
    );
    return null;
  }

  return data.map((row) => ({
    email: row.email,
    isPrimary: row.is_primary,
    addedAt: row.added_at
  }));
};

const accountName = async (userId: string): Promise<string> => {
  const { data } = await createAdminClient()
    .from('profiles')
    .select('firstname, lastname')
    .eq('id', userId)
    .single();
  return data ? joinNames(data) : 'GLA Summit User';
};

export type AdditionRequestResult =
  /**
   * The request was accepted. A code was mailed *if* the address was free —
   * whether it was is deliberately not reported, so the caller must render one
   * message for both. See `requestAddressAddition`.
   */
  | { outcome: 'accepted' }
  | { outcome: 'already-yours' }
  | { outcome: 'rate-limited' }
  | { outcome: 'failed' };

/**
 * Start adding an address: mint a code, record its digest, and mail it to the
 * address being claimed. The address is not attached to the account until
 * `confirmAddressAddition` accepts that code.
 *
 * This function does not accept emails that are already listed for another account
 * - it cannot merge accounts and it cannot behave visibly differently to the caller
 * based on if the email is in use in order to prevent enumeration.
 * As a result, it returns 'accepted', burns quota, but does not send a code and the
 * created entry is immediately unusable.
 *
 * "Already on your own account" is safe to report: the caller can read their
 * own address list on the same page.
 */
export const requestAddressAddition = async (
  userId: string,
  rawEmail: string
): Promise<AdditionRequestResult> => {
  const email = normalise(rawEmail);
  const admin = createAdminClient();

  // Before the lookup, not after: this is the one call that touches addresses
  // the caller may not own, so probing it has to cost the same quota as using
  // it. Five an hour is generous for the real flow and useless for a sweep.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from('email_verifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since);

  if ((count ?? 0) >= MAX_CLAIMS_PER_HOUR) {
    await logToDb('info', 'Address addition rate limited', 'profile/emails', {
      userId,
      context: { claimsInLastHour: count },
      retainDays: 30
    });
    return { outcome: 'rate-limited' };
  }

  const { data: existing } = await admin
    .from('account_emails')
    .select('user_id')
    .eq('email', email)
    .maybeSingle();

  if (existing?.user_id === userId) {
    return { outcome: 'already-yours' };
  }
  const heldByAnother = existing != null;

  // Supersede any live claim this user has on the same address, so an old code
  // stops working the moment a new one is sent.
  const now = new Date().toISOString();
  await admin
    .from('email_verifications')
    .update({ consumed_at: now })
    .eq('user_id', userId)
    .eq('email', email)
    .is('consumed_at', null);

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  const { error: insertError } = await admin
    .from('email_verifications')
    .insert({
      user_id: userId,
      email,
      code_hash: hashCode(userId, code),
      expires_at: new Date(Date.now() + CODE_LIFETIME_MS).toISOString(),
      // Held by someone else: the claim is recorded so the attempt is auditable
      // and costs quota, but it is dead on arrival — no code goes out, and a
      // guessed one still finds nothing live to confirm against.
      consumed_at: heldByAnother ? now : null
    });

  if (insertError) {
    after(() =>
      logToDb('error', 'Failed to record address claim', 'profile/emails', {
        userId,
        context: { message: insertError.message, code: insertError.code }
      })
    );
    return { outcome: 'failed' };
  }

  if (heldByAnother) {
    await logToDb(
      'info',
      'Address addition requested for an address on another account',
      'profile/emails',
      { userId, context: { email }, retainDays: 90 }
    );
    return { outcome: 'accepted' };
  }

  const mailResult = await sendMailApi({
    to: email,
    subject: 'Confirm your GLA Summit email address',
    bodyPlain: addressVerificationEmailText(email, code),
    body: AddressVerificationEmailFn(email, code)
  });

  if (mailResult.status !== 200) {
    after(() =>
      logToDb(
        'error',
        'Address confirmation email was rejected',
        'profile/emails',
        {
          userId,
          context: { status: mailResult.status },
          retainDays: 90
        }
      )
    );
    return { outcome: 'failed' };
  }

  return { outcome: 'accepted' };
};

export type AdditionConfirmResult =
  | { outcome: 'added' }
  | { outcome: 'invalid-code' }
  | { outcome: 'expired' }
  | { outcome: 'taken' }
  | { outcome: 'failed' };

/**
 * Finish adding an address. On success the address becomes a verified,
 * non-primary address of the account, and the address already on the account is
 * told — providing an option to complain if the addition was not authorized by the owner.
 */
export const confirmAddressAddition = async (
  userId: string,
  rawEmail: string,
  code: string
): Promise<AdditionConfirmResult> => {
  const email = normalise(rawEmail);
  const admin = createAdminClient();

  const { data: claim } = await admin
    .from('email_verifications')
    .select('id, code_hash, attempts, expires_at')
    .eq('user_id', userId)
    .eq('email', email)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!claim) {
    return { outcome: 'invalid-code' };
  }

  if (new Date(claim.expires_at).getTime() < Date.now()) {
    return { outcome: 'expired' };
  }

  if (claim.attempts >= MAX_ATTEMPTS) {
    // Burn it rather than let it be ground down indefinitely.
    await admin
      .from('email_verifications')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', claim.id);
    return { outcome: 'expired' };
  }

  if (hashCode(userId, code.trim()) !== claim.code_hash) {
    await admin
      .from('email_verifications')
      .update({ attempts: claim.attempts + 1 })
      .eq('id', claim.id);
    return { outcome: 'invalid-code' };
  }

  const now = new Date().toISOString();
  const { error: addError } = await admin
    .from('account_emails')
    .insert({ user_id: userId, email, verified_at: now });

  if (addError) {
    // 23505: another account verified the same address first — the claims are
    // deliberately not exclusive, only the addresses are.
    if (addError.code === '23505') {
      await admin
        .from('email_verifications')
        .update({ consumed_at: now })
        .eq('id', claim.id);
      return { outcome: 'taken' };
    }
    after(() =>
      logToDb('error', 'Failed to attach verified address', 'profile/emails', {
        userId,
        context: { message: addError.message, code: addError.code }
      })
    );
    return { outcome: 'failed' };
  }

  await admin
    .from('email_verifications')
    .update({ consumed_at: now })
    .eq('id', claim.id);

  await logToDb('info', 'Address added to account', 'profile/emails', {
    userId,
    context: { email },
    retainDays: 365
  });

  await notifyPrimaryOfAddition(userId, email);
  return { outcome: 'added' };
};

const notifyPrimaryOfAddition = async (userId: string, addedEmail: string) => {
  const admin = createAdminClient();
  // maybeSingle rather than single so that "no primary row" and "the lookup
  // failed" can be told apart below. single() reports both as errors.
  const { data: primary, error: lookupError } = await admin
    .from('account_emails')
    .select('email')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .maybeSingle();

  if (lookupError || !primary) {
    // Neither case is expected. An account holding any address holds exactly one
    // primary — a deferred constraint enforces it — and the caller has just
    // inserted a non-primary row, which would itself have been refused had
    // there been no primary to sit alongside. So reaching here means either the
    // account was deleted mid-flight or the query broke, and both leave an
    // addition that nobody was told about.
    await logToDb(
      'error',
      'No primary address to notify of an addition',
      'profile/emails',
      {
        userId,
        context: {
          message: lookupError?.message ?? 'account holds no primary address',
          code: lookupError?.code ?? null
        }
      }
    );
    return;
  }

  const name = await accountName(userId);
  // Best effort throughout: the address is already added, and failing the whole
  // action here would leave the user unable to tell what happened. But the
  // failure still has to be recorded — this notice is the only thing that makes
  // an addition contestable by the person it was made against, so an
  // unrecorded one that never went out is worse than a noisy log.
  try {
    const mailResult = await sendMailApi({
      to: primary.email,
      subject: 'An email address was added to your GLA Summit account',
      bodyPlain: addressAddedNoticeEmailText(name, addedEmail),
      body: AddressAddedNoticeEmailFn(name, addedEmail)
    });

    // sendMailApi resolves with a status rather than rejecting — its Mailgun
    // branch turns its own errors into status 500 — so the catch below sees
    // only transport-level throws. A rejected send arrives here.
    if (mailResult.status !== 200) {
      await logToDb(
        'error',
        'Address-added notice was rejected',
        'profile/emails',
        {
          userId,
          context: { status: mailResult.status },
          retainDays: 90
        }
      );
    }
  } catch (err) {
    await logToDb(
      'error',
      'Failed to send address-added notice',
      'profile/emails',
      {
        userId,
        context: { message: err instanceof Error ? err.message : String(err) },
        retainDays: 90
      }
    );
  }
};

export type AddressChangeResult =
  | { outcome: 'ok' }
  | { outcome: 'not-yours' }
  | { outcome: 'not-allowed' }
  | { outcome: 'failed' };

/**
 * Make one of the account's verified addresses the primary one. GoTrue is the
 * authority for that, so it is updated first and the trigger on auth.users
 * moves the flag; writing account_emails directly here would put the two out of
 * step, which is the failure this whole change exists to prevent.
 */
export const promoteAddressToPrimary = async (
  userId: string,
  rawEmail: string
): Promise<AddressChangeResult> => {
  const email = normalise(rawEmail);
  const admin = createAdminClient();

  const { data: address } = await admin
    .from('account_emails')
    .select('email, is_primary, verified_at')
    .eq('user_id', userId)
    .eq('email', email)
    .maybeSingle();

  if (!address || address.verified_at == null) {
    return { outcome: 'not-yours' };
  }
  if (address.is_primary) {
    return { outcome: 'ok' };
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    email,
    email_confirm: true
  });

  if (error) {
    after(() =>
      logToDb(
        'error',
        'Failed to promote address to primary',
        'profile/emails',
        {
          userId,
          context: { message: error.message, status: error.status },
          retainDays: 90
        }
      )
    );
    return { outcome: 'failed' };
  }

  await logToDb('info', 'Primary address changed', 'profile/emails', {
    userId,
    context: { email },
    retainDays: 365
  });
  return { outcome: 'ok' };
};

/**
 * Drop an address from the account. The primary cannot be removed: it is the
 * identity GoTrue authenticates, so removing it would orphan the account.
 */
export const removeAddress = async (
  userId: string,
  rawEmail: string
): Promise<AddressChangeResult> => {
  const email = normalise(rawEmail);
  const admin = createAdminClient();

  const { data: address } = await admin
    .from('account_emails')
    .select('is_primary')
    .eq('user_id', userId)
    .eq('email', email)
    .maybeSingle();

  if (!address) {
    return { outcome: 'not-yours' };
  }
  if (address.is_primary) {
    return { outcome: 'not-allowed' };
  }

  const { error } = await admin
    .from('account_emails')
    .delete()
    .eq('user_id', userId)
    .eq('email', email);

  if (error) {
    after(() =>
      logToDb('error', 'Failed to remove address', 'profile/emails', {
        userId,
        context: { message: error.message, code: error.code },
        retainDays: 90
      })
    );
    return { outcome: 'failed' };
  }

  await logToDb('info', 'Address removed from account', 'profile/emails', {
    userId,
    context: { email },
    retainDays: 365
  });
  return { outcome: 'ok' };
};
