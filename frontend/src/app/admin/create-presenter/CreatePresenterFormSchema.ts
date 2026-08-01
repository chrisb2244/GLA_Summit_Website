import * as z from 'zod/v4';
import { $ZodErrorTree } from 'zod/v4/core';
import { SubmittablePresentationTypeSchema } from '@/Components/PresentationSubmissions/PresentationSubmissionFormSchema';

// Mirrors PresentationSubmissionFormSchema: a permissive parser that coerces raw
// FormData entries into a stable shape (so a failed submission can be re-rendered
// with the values the admin typed), piped into the validator that carries the
// business rules.

// Messages shown back to the admin. They live here rather than in the action
// module because a 'use server' file may only export async functions.
export const ACCESS_DENIED_MESSAGE =
  'You are not authorised to create presenter accounts.';
export const EXISTING_USER_MESSAGE =
  'An account already exists for that email address. Ask the presenter to sign in and submit through the normal form, or add them as a co-presenter.';
export const CREATION_FAILED_MESSAGE =
  'The presenter could not be created. Nothing has been saved — please try again.';

const FormDataValueType = z.union([z.string(), z.instanceof(File)]);

const getString = (value: string | File | undefined): string => {
  return typeof value === 'string' ? value : '';
};

export const CreatePresenterFormParser = z
  .record(z.string(), FormDataValueType)
  .transform((input) => ({
    firstName: getString(input.firstName).trim(),
    lastName: getString(input.lastName).trim(),
    email: getString(input.email).trim().toLowerCase(),
    bio: getString(input.bio),
    title: getString(input.title),
    abstract: getString(input.abstract),
    learningPoints: getString(input.learningPoints),
    presentationType: getString(input.presentationType) || 'full length'
  }));

export type CreatePresenterParsedData = z.infer<typeof CreatePresenterFormParser>;

// Title/abstract bounds are deliberately the same as the presenter-facing form
// (PresentationSubmissionValidator) so an on-behalf submission cannot store
// anything the normal flow would have rejected.
export const CreatePresenterValidator = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email('A valid email address is required'),
  // Optional presenter details — the presenter can fill these in later from
  // /my-profile, so an empty value is valid rather than an error.
  bio: z.string().max(5000, 'Bio must be at most 5000 characters'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(150, 'Title must be at most 150 characters'),
  abstract: z
    .string()
    .min(100, 'Abstract must be at least 100 characters')
    .max(5000, 'Abstract must be at most 5000 characters'),
  learningPoints: z
    .string()
    .max(5000, 'Learning points must be at most 5000 characters'),
  presentationType: SubmittablePresentationTypeSchema
});

export const CreatePresenterFormSchema = CreatePresenterFormParser.pipe(
  CreatePresenterValidator
);

export type CreatePresenterFormData = z.infer<typeof CreatePresenterFormSchema>;
export type CreatePresenterFormErrors = $ZodErrorTree<CreatePresenterFormData>;

// Details of a successful creation, shown back to the admin so they can confirm
// who was created and follow the submission into the review flow.
export type CreatedPresenterSummary = {
  presenterName: string;
  presenterEmail: string;
  presentationId: string;
  presentationTitle: string;
};

export type CreatePresenterFormState = {
  errors?: CreatePresenterFormErrors;
  status?: {
    type: 'success' | 'error';
    message: string;
  };
  created?: CreatedPresenterSummary;
  data: CreatePresenterParsedData;
  // Incremented on every successful creation. The form uses it as a React key so
  // a success remounts (and therefore clears) the uncontrolled inputs, including
  // the file input, ready for the next presenter.
  completedCount: number;
};

export const emptyCreatePresenterData: CreatePresenterParsedData = {
  firstName: '',
  lastName: '',
  email: '',
  bio: '',
  title: '',
  abstract: '',
  learningPoints: '',
  presentationType: 'full length'
};

// ── Profile image ───────────────────────────────────────────────────────────
//
// The image is a File rather than a string, so it is validated here instead of
// in the zod schema above (which normalises Files to '' along with the rest of
// the FormData coercion).

export const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif'
];

export type ProfileImageValidationResult =
  | { valid: true; file: File | null }
  | { valid: false; message: string };

/**
 * Accepts the raw `profileImage` FormData entry and returns the file to upload,
 * or null when no image was supplied. An empty file (what browsers submit for an
 * untouched file input) counts as "no image", not as an error.
 */
export const validateProfileImage = (
  value: FormDataEntryValue | null
): ProfileImageValidationResult => {
  if (value === null || typeof value === 'string') {
    return { valid: true, file: null };
  }
  if (value.size === 0) {
    return { valid: true, file: null };
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(value.type)) {
    return {
      valid: false,
      message: 'The profile picture must be a JPEG, PNG, WebP, GIF or AVIF image'
    };
  }
  if (value.size > MAX_PROFILE_IMAGE_BYTES) {
    return {
      valid: false,
      message: 'The profile picture must be smaller than 5MB'
    };
  }
  return { valid: true, file: value };
};
