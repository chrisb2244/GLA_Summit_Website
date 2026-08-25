'use server';
import 'server-only'; // Poison the module for client code.

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import z from 'zod/v4';

import { generateAvatarIcon } from '@/actions/generateAvatarIcon';
import { submissionsForYear } from '@/app/configConstants';
import { AdminCreatedAccountEmailFn } from '@/EmailTemplates/AdminCreatedAccountEmail';
import {
  OnBehalfSubmissionEmailFn,
  OrganizerSubmissionNotificationEmailFn
} from '@/EmailTemplates/FormSubmissionEmail';
import { buildValidateLoginUrl } from '@/Components/SigninRegistration/formState';
import { sendMailApi } from '@/lib/sendMail';
import { createAdminClient } from '@/lib/supabaseClient';
import { isPresenterAdmin } from '@/lib/supabase/presenterAdmin';
import { getUser } from '@/lib/supabase/userFunctions';
import { logToDb } from '@/lib/utils';

import {
  ACCESS_DENIED_MESSAGE,
  CREATION_FAILED_MESSAGE,
  CreatePresenterFormParser,
  CreatePresenterFormSchema,
  emptyCreatePresenterData,
  EXISTING_USER_MESSAGE,
  validateProfileImage,
  type CreatePresenterFormData,
  type CreatePresenterFormState,
  type CreatePresenterParsedData
} from './CreatePresenterFormSchema';

const LOG_SOURCE = 'admin/create-presenter';

type AdminIdentity = {
  id: string;
  name: string;
};

const errorState = (
  data: CreatePresenterParsedData,
  previousState: CreatePresenterFormState,
  message: string
): CreatePresenterFormState => ({
  data,
  errors: undefined,
  created: undefined,
  completedCount: previousState.completedCount,
  status: { type: 'error', message }
});

/**
 * Creates a brand-new presenter account and submits a presentation owned by that
 * new presenter.
 *
 * The presentation is deliberately written with `submitter_id` set to the NEW
 * user (never the admin who filled the form) and a matching accepted row in
 * presentation_presenters, so from this point on it is an ordinary submission:
 * the review page picks it up, organizer voting applies, and the accept/decline
 * emails go to the presenter through the existing outcome route.
 *
 * The writes use the admin client because RLS on presentation_submissions only
 * permits inserts where submitter_id = auth.uid(), which is precisely what this
 * flow must not do. Membership of presenter_admins is therefore re-checked here
 * (through the caller's own session, under RLS) before anything is written — the
 * page gate protects the rendering, this protects the data.
 */
export const createPresenterAndSubmission = async (
  previousState: CreatePresenterFormState,
  formData: FormData
): Promise<CreatePresenterFormState> => {
  const raw = Object.fromEntries(formData.entries());
  const parsedData = CreatePresenterFormParser.parse(raw);

  const admin = await getActingAdmin();
  if (admin === null) {
    await logToDb(
      'error',
      'Rejected presenter creation from a non-admin caller',
      LOG_SOURCE
    );
    return errorState(parsedData, previousState, ACCESS_DENIED_MESSAGE);
  }

  const validationResult = CreatePresenterFormSchema.safeParse(raw);
  if (!validationResult.success) {
    return {
      data: parsedData,
      errors: z.treeifyError(validationResult.error),
      created: undefined,
      completedCount: previousState.completedCount,
      status: undefined
    };
  }

  const imageResult = validateProfileImage(formData.get('profileImage'));
  if (!imageResult.valid) {
    return errorState(parsedData, previousState, imageResult.message);
  }

  const validatedData = validationResult.data;
  const supabaseAdmin = createAdminClient();

  const existingUserId = await findExistingUserId(
    validatedData.email,
    supabaseAdmin
  );
  if (existingUserId === 'lookup-failed') {
    return errorState(parsedData, previousState, CREATION_FAILED_MESSAGE);
  }
  if (existingUserId !== null) {
    return errorState(parsedData, previousState, EXISTING_USER_MESSAGE);
  }

  const created = await createPresenterAccount(
    validatedData,
    supabaseAdmin,
    admin.id
  );
  if (!created.success) {
    return errorState(
      parsedData,
      previousState,
      created.reason === 'already-registered'
        ? EXISTING_USER_MESSAGE
        : CREATION_FAILED_MESSAGE
    );
  }
  const { userId, otpCode } = created;

  // Everything below owns the new auth user, so any failure has to unwind it —
  // a half-created presenter would be invisible to the admin but would block the
  // email address from ever being used again.
  const rollback = async (uploadedAvatarPath?: string | null) => {
    if (uploadedAvatarPath) {
      await supabaseAdmin.storage.from('avatars').remove([uploadedAvatarPath]);
    }
    await supabaseAdmin.auth.admin.deleteUser(userId);
  };

  const profileResult = await applyProfileDetails(
    userId,
    validatedData,
    imageResult.file,
    supabaseAdmin,
    admin.id
  );
  if (!profileResult.success) {
    await rollback(profileResult.uploadedAvatarPath);
    return errorState(parsedData, previousState, CREATION_FAILED_MESSAGE);
  }

  const submissionResult = await insertSubmissionForPresenter(
    userId,
    validatedData,
    supabaseAdmin,
    admin.id
  );
  if (!submissionResult.success) {
    await rollback(profileResult.uploadedAvatarPath);
    return errorState(parsedData, previousState, CREATION_FAILED_MESSAGE);
  }

  const presenterName = `${validatedData.firstName} ${validatedData.lastName}`;

  await sendCreationEmails({
    presentationData: validatedData,
    presenterName,
    otpCode,
    createdByName: admin.name,
    presentationId: submissionResult.presentationId,
    supabaseAdmin
  });

  // The submission is now under review like any other, so refresh the page the
  // organizers work from.
  revalidatePath('/review-submissions');

  return {
    data: emptyCreatePresenterData,
    errors: undefined,
    completedCount: previousState.completedCount + 1,
    created: {
      presenterName,
      presenterEmail: validatedData.email,
      presentationId: submissionResult.presentationId,
      presentationTitle: validatedData.title
    },
    status: {
      type: 'success',
      message: `${presenterName} has been created and "${validatedData.title}" has been submitted on their behalf.`
    }
  };
};

/**
 * Resolves the signed-in caller, but only if they are on the presenter_admins
 * allow-list. Returns null for everyone else, including logged-out callers.
 */
const getActingAdmin = async (): Promise<AdminIdentity | null> => {
  const [user, allowed] = await Promise.all([getUser(), isPresenterAdmin()]);
  if (user === null || !allowed) {
    return null;
  }

  const supabaseAdmin = createAdminClient();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('firstname, lastname')
    .eq('id', user.id)
    .maybeSingle();

  const profileName = profile
    ? `${profile.firstname} ${profile.lastname}`.trim()
    : '';

  return {
    id: user.id,
    // The name is only ever used as email copy ("X has created an account for
    // you"), so fall back through email to a generic description rather than
    // leaving a blank in the middle of a sentence.
    name: profileName || user.email || 'A GLA Summit organizer'
  };
};

const findExistingUserId = async (
  email: string,
  supabaseAdmin: ReturnType<typeof createAdminClient>
): Promise<string | null | 'lookup-failed'> => {
  // Check for any address on the account, not just its primary.
  // Otherwise, an attempt will be made to create a new user, which will fail
  // when inserting the email into account_emails by trigger.
  // That would be misreported as a failure rather than an existing account.
  const { data, error } = await supabaseAdmin
    .from('account_emails')
    .select('user_id')
    .ilike('email', email)
    .maybeSingle();

  if (error) {
    await logToDb('error', 'Presenter email lookup failed', LOG_SOURCE, {
      context: { message: error.message, code: error.code }
    });
    return 'lookup-failed';
  }
  return data?.user_id ?? null;
};

type AccountCreationResult =
  | { success: true; userId: string; otpCode: string }
  | { success: false; reason: 'already-registered' | 'failed' };

/**
 * Creates the auth user via a signup link, mirroring how new co-presenter
 * accounts are made. The generated link yields the one-time passcode the welcome
 * email needs, and the firstname/lastname metadata drives the handle_new_user
 * trigger that seeds public.profiles and public.account_emails.
 */
const createPresenterAccount = async (
  data: CreatePresenterFormData,
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  actingAdminId: string
): Promise<AccountCreationResult> => {
  const randomPassword = randomBytes(32).toString('hex');
  const { data: newUser, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email: data.email,
    password: randomPassword,
    options: {
      data: { firstname: data.firstName, lastname: data.lastName }
    }
  });

  if (error || !newUser?.user) {
    await logToDb('error', 'Presenter account creation failed', LOG_SOURCE, {
      userId: actingAdminId,
      context: {
        message: error?.message ?? 'No user returned',
        status: error?.status
      }
    });
    // The account_emails pre-check missed an account that auth.users does have —
    // e.g. a row the store_email trigger never wrote. Report it as the existing
    // account it is rather than as an unexplained failure. Supabase has worded
    // this both as "User already registered" and "…has already been registered",
    // so match either phrasing.
    const alreadyRegistered = /already\s+(been\s+)?registered/i.test(
      error?.message ?? ''
    );
    return {
      success: false,
      reason: alreadyRegistered ? 'already-registered' : 'failed'
    };
  }

  return {
    success: true,
    userId: newUser.user.id,
    otpCode: newUser.properties.email_otp
  };
};

type ProfileResult = {
  success: boolean;
  uploadedAvatarPath: string | null;
};

/**
 * Fills in the parts of the profile the signup trigger cannot: the optional bio,
 * and the optional profile picture (uploaded with the admin client, since the new
 * presenter has no session of their own to upload under).
 */
const applyProfileDetails = async (
  userId: string,
  data: CreatePresenterFormData,
  imageFile: File | null,
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  actingAdminId: string
): Promise<ProfileResult> => {
  let uploadedAvatarPath: string | null = null;

  if (imageFile !== null) {
    const extension = imageFile.name.split('.').pop() ?? 'png';
    const remoteName = `${userId}_${Math.random()}.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(remoteName, imageFile, {
        cacheControl: '31536000',
        contentType: imageFile.type,
        upsert: false
      });

    if (uploadError) {
      await logToDb('error', 'Presenter avatar upload failed', LOG_SOURCE, {
        userId: actingAdminId,
        context: { message: uploadError.message }
      });
      return { success: false, uploadedAvatarPath: null };
    }
    uploadedAvatarPath = remoteName;
  }

  const bio = data.bio.trim();
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      firstname: data.firstName,
      lastname: data.lastName,
      ...(bio.length > 0 ? { bio } : {}),
      ...(uploadedAvatarPath ? { avatar_url: uploadedAvatarPath } : {})
    })
    .eq('id', userId);

  if (profileError) {
    await logToDb('error', 'Presenter profile update failed', LOG_SOURCE, {
      userId: actingAdminId,
      context: { message: profileError.message, code: profileError.code }
    });
    return { success: false, uploadedAvatarPath };
  }

  // Icon generation is best-effort: the avatar itself is stored, and the icon is
  // regenerated on demand when it is missing (see
  // downloadIconAvatarAndGenerateIfNeeded), so a failure here must not undo an
  // otherwise complete presenter.
  if (uploadedAvatarPath !== null) {
    await generateAvatarIcon(uploadedAvatarPath).catch(async (e: unknown) => {
      await logToDb(
        'error',
        'Presenter avatar icon generation failed',
        LOG_SOURCE,
        {
          userId: actingAdminId,
          context: { message: e instanceof Error ? e.message : String(e) }
        }
      );
      return null;
    });
  }

  return { success: true, uploadedAvatarPath };
};

type SubmissionResult =
  { success: true; presentationId: string } | { success: false };

const insertSubmissionForPresenter = async (
  presenterId: string,
  data: CreatePresenterFormData,
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  actingAdminId: string
): Promise<SubmissionResult> => {
  const learningPoints = data.learningPoints.trim();

  const { data: submission, error } = await supabaseAdmin
    .from('presentation_submissions')
    .insert({
      title: data.title,
      abstract: data.abstract,
      learning_points: learningPoints.length > 0 ? learningPoints : null,
      // The new presenter owns the submission, NOT the admin who filled the form.
      submitter_id: presenterId,
      year: submissionsForYear,
      is_submitted: true,
      presentation_type: data.presentationType
      // consent_given_at is deliberately left unset: the speaker agreement has
      // not been accepted by the presenter themselves, and the column records
      // exactly that act. It gates nothing, so the submission still flows
      // through review normally.
    })
    .select('id')
    .single();

  if (error || !submission) {
    await logToDb('error', 'On-behalf submission insert failed', LOG_SOURCE, {
      userId: actingAdminId,
      context: { message: error?.message, code: error?.code }
    });
    return { success: false };
  }

  const { error: presenterError } = await supabaseAdmin
    .from('presentation_presenters')
    .insert({
      presentation_id: submission.id,
      presenter_id: presenterId,
      status: 'accepted'
    });

  if (presenterError) {
    await supabaseAdmin
      .from('presentation_submissions')
      .delete()
      .eq('id', submission.id);
    await logToDb('error', 'On-behalf presenter link failed', LOG_SOURCE, {
      userId: actingAdminId,
      context: { message: presenterError.message, code: presenterError.code }
    });
    return { success: false };
  }

  return { success: true, presentationId: submission.id };
};

/**
 * Sends the welcome email (account + one-time passcode), the on-behalf
 * submission receipt, and the organizer notification the normal flow also sends.
 *
 * Email failures are logged but never fail the action: the presenter and their
 * submission already exist, and undoing them because a mail server hiccuped
 * would lose real work. The admin can resend by contacting the presenter.
 */
const sendCreationEmails = async (options: {
  presentationData: CreatePresenterFormData;
  presenterName: string;
  otpCode: string;
  createdByName: string;
  presentationId: string;
  supabaseAdmin: ReturnType<typeof createAdminClient>;
}) => {
  const {
    presentationData,
    presenterName,
    otpCode,
    createdByName,
    presentationId,
    supabaseAdmin
  } = options;

  const dataForEmails = {
    title: presentationData.title,
    abstract: presentationData.abstract,
    learningPoints: presentationData.learningPoints,
    presentationType: presentationData.presentationType,
    submitter: {
      firstName: presentationData.firstName,
      lastName: presentationData.lastName,
      email: presentationData.email
    },
    otherPresenters: [],
    speakerAgreement: false,
    skipDuplicateCheck: false,
    submitIntent: 'submit' as const
  };

  type EmailResult = { status: number; role: string };
  const emailTasks: Array<Promise<EmailResult>> = [];

  emailTasks.push(
    sendMailApi({
      to: presentationData.email,
      subject: 'GLA Summit: An account has been created for you',
      ...AdminCreatedAccountEmailFn(
        presenterName,
        createdByName,
        otpCode,
        buildValidateLoginUrl(presentationData.email)
      )
    }).then((r) => ({ status: r.status, role: 'new_presenter_welcome' }))
  );

  emailTasks.push(
    sendMailApi({
      to: presentationData.email,
      subject: 'GLA Summit: A presentation has been submitted on your behalf',
      ...OnBehalfSubmissionEmailFn(dataForEmails, presenterName, createdByName)
    }).then((r) => ({ status: r.status, role: 'new_presenter_submission' }))
  );

  const { data: organizerRows } = await supabaseAdmin
    .from('organizers')
    .select('id');
  const organizerIds = (organizerRows ?? []).map((o) => o.id);
  if (organizerIds.length > 0) {
    const { data: organizerEmailRows } = await supabaseAdmin
      .from('account_emails')
      .select('email')
      .eq('is_primary', true)
      .in('user_id', organizerIds);

    for (const { email } of organizerEmailRows ?? []) {
      emailTasks.push(
        sendMailApi({
          to: email,
          subject: 'GLA Summit: New presentation submitted',
          ...OrganizerSubmissionNotificationEmailFn(
            presentationData.title,
            presentationData.presentationType,
            presenterName,
            presentationData.email,
            createdByName
          )
        }).then((r) => ({ status: r.status, role: 'organizer' }))
      );
    }
  }

  const results = await Promise.all(emailTasks);
  const failures = results.filter((r) => r.status !== 200);
  if (failures.length > 0) {
    await logToDb(
      'error',
      'One or more presenter-creation emails failed to send',
      LOG_SOURCE,
      {
        context: {
          presentationId,
          failures: failures.map(({ role, status }) => ({ role, status }))
        }
      }
    );
  }
};
