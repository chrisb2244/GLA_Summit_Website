import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACCESS_DENIED_MESSAGE,
  CREATION_FAILED_MESSAGE,
  EXISTING_USER_MESSAGE,
  emptyCreatePresenterData,
  type CreatePresenterFormState
} from './CreatePresenterFormSchema';

vi.mock('server-only', () => ({}));

vi.mock('@/app/configConstants', () => ({
  submissionsForYear: '2026',
  COPRESENTER_INVITE_WORKFLOW: false
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

vi.mock('@/lib/utils', () => ({
  logToDb: vi.fn()
}));

vi.mock('@/lib/sendMail', () => ({
  sendMailApi: vi.fn(async () => ({ status: 200 }))
}));

vi.mock('@/actions/generateAvatarIcon', () => ({
  generateAvatarIcon: vi.fn(async () => 'avatar-icon.webp')
}));

vi.mock('@/EmailTemplates/AdminCreatedAccountEmail', () => ({
  AdminCreatedAccountEmailFn: vi.fn(() => ({
    body: 'welcome-body',
    bodyPlain: 'welcome-plain'
  }))
}));

vi.mock('@/EmailTemplates/FormSubmissionEmail', () => ({
  OnBehalfSubmissionEmailFn: vi.fn(() => ({
    body: 'on-behalf-body',
    bodyPlain: 'on-behalf-plain'
  })),
  OrganizerSubmissionNotificationEmailFn: vi.fn(() => ({
    body: 'organizer-body',
    bodyPlain: 'organizer-plain'
  }))
}));

vi.mock('@/lib/supabase/presenterAdmin', () => ({
  isPresenterAdmin: vi.fn()
}));

vi.mock('@/lib/supabase/userFunctions', () => ({
  getUser: vi.fn()
}));

vi.mock('@/lib/supabaseClient', () => ({
  createAdminClient: vi.fn()
}));

import { createPresenterAndSubmission } from './createPresenterActions';
import { isPresenterAdmin } from '@/lib/supabase/presenterAdmin';
import { getUser } from '@/lib/supabase/userFunctions';
import { createAdminClient } from '@/lib/supabaseClient';
import { sendMailApi } from '@/lib/sendMail';

const ADMIN_ID = 'admin-user-id';
const NEW_USER_ID = 'brand-new-presenter-id';
const PRESENTATION_ID = 'new-presentation-id';

type RecordedWrite = {
  table: string;
  op: 'insert' | 'update' | 'delete';
  payload?: unknown;
};

type ClientOverrides = Partial<Record<string, { data?: unknown; error?: unknown }>>;

// Minimal stand-in for the Supabase admin client: each chain resolves by
// "<table>.<operation>" so a test can make one specific step fail while the rest
// succeed, and every insert/update/delete is recorded for assertions.
const createFakeAdminClient = (overrides: ClientOverrides = {}) => {
  const writes: RecordedWrite[] = [];
  const defaults: ClientOverrides = {
    // No existing account for the email.
    'account_emails.select.ilike': { data: null, error: null },
    // Organizer directory lookup.
    'account_emails.select': {
      data: [{ user_id: 'organizer-1', email: 'organizer@example.com' }],
      error: null
    },
    'organizers.select': { data: [{ id: 'organizer-1' }], error: null },
    'profiles.select': {
      data: { firstname: 'Admin', lastname: 'Person' },
      error: null
    },
    'profiles.update': { data: null, error: null },
    'presentation_submissions.insert': {
      data: { id: PRESENTATION_ID },
      error: null
    },
    'presentation_submissions.delete': { data: null, error: null },
    'presentation_presenters.insert': { data: null, error: null }
  };
  const results = { ...defaults, ...overrides };

  const from = (table: string) => {
    let operation = 'select';
    let usedIlike = false;

    const resolve = () => {
      const key = `${table}.${operation}${usedIlike ? '.ilike' : ''}`;
      return Promise.resolve(results[key] ?? { data: null, error: null });
    };

    const builder = {
      select: () => builder,
      eq: () => builder,
      in: () => builder,
      ilike: () => {
        usedIlike = true;
        return builder;
      },
      insert: (payload: unknown) => {
        operation = 'insert';
        writes.push({ table, op: 'insert', payload });
        return builder;
      },
      update: (payload: unknown) => {
        operation = 'update';
        writes.push({ table, op: 'update', payload });
        return builder;
      },
      delete: () => {
        operation = 'delete';
        writes.push({ table, op: 'delete' });
        return builder;
      },
      single: () => resolve(),
      maybeSingle: () => resolve(),
      then: (
        onFulfilled?: (value: unknown) => unknown,
        onRejected?: (reason: unknown) => unknown
      ) => resolve().then(onFulfilled, onRejected)
    };
    return builder;
  };

  const storageUpload = vi.fn(
    async (
      _path: string,
      _file: unknown,
      _options?: unknown
    ): Promise<{ data: unknown; error: unknown }> => ({
      data: null,
      error: null
    })
  );
  const storageRemove = vi.fn(async () => ({ data: null, error: null }));
  const generateLink = vi.fn(async () => ({
    data: {
      user: { id: NEW_USER_ID },
      properties: { email_otp: '123456' }
    },
    error: null
  }));
  const deleteUser = vi.fn(async () => ({ data: null, error: null }));

  return {
    client: {
      from,
      storage: {
        from: () => ({ upload: storageUpload, remove: storageRemove })
      },
      auth: { admin: { generateLink, deleteUser } }
    },
    writes,
    storageUpload,
    storageRemove,
    generateLink,
    deleteUser
  };
};

const previousState: CreatePresenterFormState = {
  data: emptyCreatePresenterData,
  completedCount: 0
};

const buildFormData = (
  overrides: Partial<Record<string, string>> = {}
): FormData => {
  const values: Record<string, string> = {
    firstName: 'Grace',
    lastName: 'Hopper',
    email: 'Grace.Hopper@Example.com',
    bio: 'Compiles things.',
    title: 'Compilers For Everyone',
    abstract: 'An abstract about compilers. '.repeat(6),
    learningPoints: 'How compilation works.',
    presentationType: '15 minutes',
    ...overrides
  };
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

const asAdmin = () => {
  vi.mocked(isPresenterAdmin).mockResolvedValue(true);
  vi.mocked(getUser).mockResolvedValue({
    id: ADMIN_ID,
    email: 'admin@example.com'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
};

describe('createPresenterAndSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refuses to act for a caller who is not a presenter admin', async () => {
    vi.mocked(isPresenterAdmin).mockResolvedValue(false);
    vi.mocked(getUser).mockResolvedValue({
      id: 'ordinary-user'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const fake = createFakeAdminClient();
    vi.mocked(createAdminClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fake.client as any
    );

    const result = await createPresenterAndSubmission(
      previousState,
      buildFormData()
    );

    expect(result.status).toEqual({
      type: 'error',
      message: ACCESS_DENIED_MESSAGE
    });
    expect(fake.generateLink).not.toHaveBeenCalled();
    expect(fake.writes).toHaveLength(0);
  });

  it('refuses to act for a logged-out caller even if the check passes', async () => {
    vi.mocked(isPresenterAdmin).mockResolvedValue(true);
    vi.mocked(getUser).mockResolvedValue(null);
    const fake = createFakeAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminClient).mockReturnValue(fake.client as any);

    const result = await createPresenterAndSubmission(
      previousState,
      buildFormData()
    );

    expect(result.status?.type).toEqual('error');
    expect(fake.generateLink).not.toHaveBeenCalled();
  });

  it('returns field errors without creating anything when the form is invalid', async () => {
    asAdmin();
    const fake = createFakeAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminClient).mockReturnValue(fake.client as any);

    const result = await createPresenterAndSubmission(
      previousState,
      buildFormData({ abstract: 'too short', email: 'nope' })
    );

    expect(result.errors?.properties?.abstract).toBeDefined();
    expect(result.errors?.properties?.email).toBeDefined();
    expect(fake.generateLink).not.toHaveBeenCalled();
    // The typed values survive so the admin does not lose their work.
    expect(result.data.title).toEqual('Compilers For Everyone');
  });

  it('refuses when an account already exists for the email', async () => {
    asAdmin();
    const fake = createFakeAdminClient({
      'account_emails.select.ilike': {
        data: { user_id: 'existing-user' },
        error: null
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminClient).mockReturnValue(fake.client as any);

    const result = await createPresenterAndSubmission(
      previousState,
      buildFormData()
    );

    expect(result.status).toEqual({
      type: 'error',
      message: EXISTING_USER_MESSAGE
    });
    expect(fake.generateLink).not.toHaveBeenCalled();
  });

  it('creates the account and files the submission under the NEW user', async () => {
    asAdmin();
    const fake = createFakeAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminClient).mockReturnValue(fake.client as any);

    const result = await createPresenterAndSubmission(
      previousState,
      buildFormData()
    );

    expect(result.status?.type).toEqual('success');
    expect(result.created).toEqual({
      presenterName: 'Grace Hopper',
      presenterEmail: 'grace.hopper@example.com',
      presentationId: PRESENTATION_ID,
      presentationTitle: 'Compilers For Everyone'
    });

    expect(fake.generateLink).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'signup',
        email: 'grace.hopper@example.com',
        options: {
          data: { firstname: 'Grace', lastname: 'Hopper' }
        }
      })
    );

    const submissionWrite = fake.writes.find(
      (w) => w.table === 'presentation_submissions'
    );
    expect(submissionWrite?.payload).toEqual(
      expect.objectContaining({
        title: 'Compilers For Everyone',
        is_submitted: true,
        year: '2026',
        presentation_type: '15 minutes',
        // The whole point of the panel: the presenter owns the submission.
        submitter_id: NEW_USER_ID
      })
    );
    // The acting admin must never appear as the submitter.
    expect(submissionWrite?.payload).not.toEqual(
      expect.objectContaining({ submitter_id: ADMIN_ID })
    );

    const presenterWrite = fake.writes.find(
      (w) => w.table === 'presentation_presenters'
    );
    expect(presenterWrite?.payload).toEqual({
      presentation_id: PRESENTATION_ID,
      presenter_id: NEW_USER_ID,
      status: 'accepted'
    });
  });

  it('stores the optional bio on the new presenter profile', async () => {
    asAdmin();
    const fake = createFakeAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminClient).mockReturnValue(fake.client as any);

    await createPresenterAndSubmission(previousState, buildFormData());

    const profileWrite = fake.writes.find((w) => w.table === 'profiles');
    expect(profileWrite?.payload).toEqual(
      expect.objectContaining({
        firstname: 'Grace',
        lastname: 'Hopper',
        bio: 'Compiles things.'
      })
    );
  });

  it('omits the bio and avatar keys when neither was provided', async () => {
    asAdmin();
    const fake = createFakeAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminClient).mockReturnValue(fake.client as any);

    await createPresenterAndSubmission(
      previousState,
      buildFormData({ bio: '   ' })
    );

    const profileWrite = fake.writes.find((w) => w.table === 'profiles');
    expect(profileWrite?.payload).not.toHaveProperty('bio');
    expect(profileWrite?.payload).not.toHaveProperty('avatar_url');
    expect(fake.storageUpload).not.toHaveBeenCalled();
  });

  it('uploads a supplied profile picture and points the profile at it', async () => {
    asAdmin();
    const fake = createFakeAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminClient).mockReturnValue(fake.client as any);

    const formData = buildFormData();
    formData.set(
      'profileImage',
      new File(['image-bytes'], 'grace.png', { type: 'image/png' })
    );

    await createPresenterAndSubmission(previousState, formData);

    expect(fake.storageUpload).toHaveBeenCalledTimes(1);
    const uploadedPath = fake.storageUpload.mock.calls[0][0];
    expect(uploadedPath).toContain(NEW_USER_ID);
    expect(uploadedPath.endsWith('.png')).toBe(true);

    const profileWrite = fake.writes.find((w) => w.table === 'profiles');
    expect(profileWrite?.payload).toEqual(
      expect.objectContaining({ avatar_url: uploadedPath })
    );
  });

  it('rejects a profile picture that is not an image, before creating anything', async () => {
    asAdmin();
    const fake = createFakeAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminClient).mockReturnValue(fake.client as any);

    const formData = buildFormData();
    formData.set(
      'profileImage',
      new File(['pdf-bytes'], 'talk.pdf', { type: 'application/pdf' })
    );

    const result = await createPresenterAndSubmission(previousState, formData);

    expect(result.status?.type).toEqual('error');
    expect(fake.generateLink).not.toHaveBeenCalled();
  });

  it('sends the welcome, on-behalf and organizer emails', async () => {
    asAdmin();
    const fake = createFakeAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminClient).mockReturnValue(fake.client as any);

    await createPresenterAndSubmission(previousState, buildFormData());

    const subjects = vi
      .mocked(sendMailApi)
      .mock.calls.map(([content]) => `${content.to} :: ${content.subject}`);

    expect(subjects).toContain(
      'grace.hopper@example.com :: GLA Summit: An account has been created for you'
    );
    expect(subjects).toContain(
      'grace.hopper@example.com :: GLA Summit: A presentation has been submitted on your behalf'
    );
    expect(subjects).toContain(
      'organizer@example.com :: GLA Summit: New presentation submitted'
    );
  });

  it('reports an existing account when signup fails as already registered', async () => {
    asAdmin();
    const fake = createFakeAdminClient();
    fake.generateLink.mockResolvedValueOnce({
      data: { user: null, properties: null },
      error: { message: 'A user with this email address has already been registered' }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminClient).mockReturnValue(fake.client as any);

    const result = await createPresenterAndSubmission(
      previousState,
      buildFormData()
    );

    expect(result.status).toEqual({
      type: 'error',
      message: EXISTING_USER_MESSAGE
    });
    expect(fake.deleteUser).not.toHaveBeenCalled();
  });

  it('deletes the half-created user when the submission insert fails', async () => {
    asAdmin();
    const fake = createFakeAdminClient({
      'presentation_submissions.insert': {
        data: null,
        error: { message: 'insert exploded', code: '500' }
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminClient).mockReturnValue(fake.client as any);

    const result = await createPresenterAndSubmission(
      previousState,
      buildFormData()
    );

    expect(result.status).toEqual({
      type: 'error',
      message: CREATION_FAILED_MESSAGE
    });
    expect(fake.deleteUser).toHaveBeenCalledWith(NEW_USER_ID);
    expect(vi.mocked(sendMailApi)).not.toHaveBeenCalled();
  });

  it('removes the uploaded avatar as well when rolling back', async () => {
    asAdmin();
    const fake = createFakeAdminClient({
      'presentation_presenters.insert': {
        data: null,
        error: { message: 'link exploded', code: '500' }
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminClient).mockReturnValue(fake.client as any);

    const formData = buildFormData();
    formData.set(
      'profileImage',
      new File(['image-bytes'], 'grace.png', { type: 'image/png' })
    );

    const result = await createPresenterAndSubmission(previousState, formData);

    expect(result.status?.type).toEqual('error');
    expect(fake.storageRemove).toHaveBeenCalledTimes(1);
    expect(fake.deleteUser).toHaveBeenCalledWith(NEW_USER_ID);
    // The orphaned submission row is deleted too — it has an FK to profiles that
    // does not cascade, so deleting the user without it would fail.
    expect(
      fake.writes.some(
        (w) => w.table === 'presentation_submissions' && w.op === 'delete'
      )
    ).toBe(true);
  });

  it('clears the form and bumps the completed count on success', async () => {
    asAdmin();
    const fake = createFakeAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createAdminClient).mockReturnValue(fake.client as any);

    const result = await createPresenterAndSubmission(
      { ...previousState, completedCount: 2 },
      buildFormData()
    );

    expect(result.completedCount).toEqual(3);
    expect(result.data).toEqual(emptyCreatePresenterData);
  });
});
