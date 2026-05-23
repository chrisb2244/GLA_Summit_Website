import * as z from 'zod/v4';
import { $ZodErrorTree } from 'zod/v4/core';

export const SubmitIntentSchema = z.enum(['saveDraft', 'submit']);

export const SubmittablePresentationTypeSchema = z.enum([
  '7x7',
  'full length',
  'panel',
  '15 minutes'
]);

const StaticPresentationFormSchema = z.object({
  'submitter.firstName': z.string(),
  'submitter.lastName': z.string(),
  'submitter.email': z.email(),
  speakerAgreement: z
    .string()
    .optional()
    .transform((s) => s === 'on'),
  skipDuplicateCheck: z
    .string()
    .optional()
    .transform((s) => s === 'true'),
  submitIntent: SubmitIntentSchema.optional(),
  title: z.string(),
  abstract: z.string(),
  learningPoints: z.string(),
  presentationType: SubmittablePresentationTypeSchema,
  presentationId: z
    .string()
    .optional()
    .transform((s) => {
      if (typeof s === 'string' && s.length === 0) {
        return undefined;
      }
      return s;
    }),
  redirectTo: z
    .string()
    .optional()
    .transform((s) => {
      if (typeof s === 'string' && s.length === 0) {
        return undefined;
      }
      return s;
    })
});
const StaticKeys = StaticPresentationFormSchema.shape;

export const PresentationSubmissionFormSchema =
  StaticPresentationFormSchema.catchall(z.email()).transform((input, ctx) => {
    const otherPresenters = Object.entries(input)
      .map(([key, value]) => {
        if (/otherPresenters\.[0-9]+\.email/.test(key)) {
          return value as string;
        }
        if (Object.keys(StaticKeys).includes(key)) {
          return null;
        }
        ctx.issues.push({
          code: 'unrecognized_keys',
          input,
          keys: [key],
          message: 'Unexpected key',
          path: [key],
          fatal: true
        });
      })
      .filter((v) => v !== null) as string[];
    return {
      title: input.title,
      abstract: input.abstract,
      submitter: {
        firstName: input['submitter.firstName'],
        lastName: input['submitter.lastName'],
        email: input['submitter.email']
      },
      learningPoints: input.learningPoints,
      presentationType: input.presentationType,
      speakerAgreement: input.speakerAgreement ?? false,
      skipDuplicateCheck: input.skipDuplicateCheck ?? false,
      submitIntent: input.submitIntent ?? 'submit',
      otherPresenters,
      ...(input.presentationId !== undefined
        ? { presentationId: input.presentationId }
        : {}),
      ...(input.redirectTo !== undefined
        ? { redirectTo: input.redirectTo }
        : {})
    };
  });

export type PresentationSubmissionFormData = z.infer<
  typeof PresentationSubmissionFormSchema
>;

export type PresentationSubmissionFormErrors =
  $ZodErrorTree<PresentationSubmissionFormData>;

export type PresentationSubmissionFormState = {
  errors?: PresentationSubmissionFormErrors;
  data: PresentationSubmissionFormData & {
    redirectTo?: string;
  };
};
