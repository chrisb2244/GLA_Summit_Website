import * as z from 'zod/v4';
import { $ZodErrorTree } from 'zod/v4/core';

export const SubmitIntentSchema = z.enum(['saveDraft', 'submit']);

export const SubmittablePresentationTypeSchema = z.enum([
  '7x7',
  'full length',
  'panel',
  '15 minutes'
]);

const FormDataValueType = z.union([z.string(), z.instanceof(File)]);
function getString<F extends string | undefined>(
  value: string | File,
  fallback: F = '' as F
): string | F {
  if (typeof value === 'string') {
    return value;
  }
  return fallback;
}

export const PresentationFormParser = z
  .record(z.string(), FormDataValueType)
  .transform((input) => {
    const otherPresenters = Object.entries(input)
      .filter(([key]) => /otherPresenters\.[0-9]+\.email/.test(key))
      .map(([_, value]) => value)
      .filter((v) => typeof v === 'string' && v.length > 0) as string[];

    return {
      title: getString(input.title, ''),
      abstract: getString(input.abstract, ''),
      submitter: {
        firstName: getString(input['submitter.firstName'], ''),
        lastName: getString(input['submitter.lastName'], ''),
        email: getString(input['submitter.email'], '')
      },
      learningPoints: getString(input.learningPoints, ''),
      presentationType: getString(input.presentationType, 'full length'),
      otherPresenters,

      speakerAgreement: input.speakerAgreement === 'on',
      skipDuplicateCheck: input.skipDuplicateCheck === 'true',
      submitIntent: getString(input.submitIntent, 'submit'),

      ...(input.presentationId && typeof input.presentationId === 'string'
        ? { presentationId: input.presentationId }
        : {}),
      ...(input.redirectTo && typeof input.redirectTo === 'string'
        ? { redirectTo: input.redirectTo }
        : {})
    };
  });

export type PresentationParsedData = z.infer<typeof PresentationFormParser>;

export const PresentationSubmissionValidator = z
  .object({
    title: z.string().min(1, 'Title is required'),
    abstract: z.string().min(150, 'Abstract must be at least 150 characters'),
    learningPoints: z.string().min(1, 'Learning points are required'),
    presentationType: SubmittablePresentationTypeSchema,
    submitter: z.object({
      firstName: z.string().min(1, 'Submitter first name is required'),
      lastName: z.string().min(1, 'Submitter last name is required'),
      email: z.email('Submitter email must be a valid email address')
    }),

    speakerAgreement: z.boolean(),
    skipDuplicateCheck: z.boolean(),
    submitIntent: SubmitIntentSchema,
    otherPresenters: z.array(z.email('Each presenter email must be valid')),
    presentationId: z.string().optional(),
    redirectTo: z.string().optional()
  })
  .refine(
    (data) => {
      if (data.submitIntent === 'submit' && !data.speakerAgreement) {
        // Block final submission if speaker agreement is not checked, but allow saving drafts without agreement
        return false;
      }
      return true;
    },
    {
      message:
        'You must agree to the speaker agreement to submit your presentation',
      path: ['speakerAgreement']
    }
  );

export const PresentationSubmissionFormSchema = PresentationFormParser.pipe(
  PresentationSubmissionValidator
);
export type PresentationSubmissionFormData = z.infer<
  typeof PresentationSubmissionFormSchema
>;
export type PresentationSubmissionFormErrors =
  $ZodErrorTree<PresentationSubmissionFormData>;

export type PresentationSubmissionFormState = {
  errors?: PresentationSubmissionFormErrors;
  duplicateWarning?: {
    existingId: string;
    existingTitle: string;
  };
  status?: {
    type: 'success' | 'error';
    message: string;
  };
  data: PresentationParsedData;
};
