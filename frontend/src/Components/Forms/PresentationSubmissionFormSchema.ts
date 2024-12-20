import * as z from 'zod';

export const SubmittablePresentationTypeSchema = z.enum([
  '7x7',
  'full length',
  'panel',
  '15 minutes'
]);

const StaticPresentationFormSchema = z.object({
  'submitter.firstName': z.string(),
  'submitter.lastName': z.string(),
  'submitter.email': z.string().email(),
  isFinal: z
    .string()
    .optional()
    .transform((s) => s === 'on'),
  title: z.string(),
  abstract: z.string(),
  learningPoints: z.string(),
  presentationType: SubmittablePresentationTypeSchema,
  otherPresenters: z.array(z.string().email()).optional()
});
const StaticKeys = StaticPresentationFormSchema.shape;

export const PresentationSubmissionFormSchema =
  StaticPresentationFormSchema.catchall(z.any()).transform((input, ctx) => {
    const otherPresenters = Object.entries(input)
      .map(([key, value]) => {
        if (/otherPresenters\.[0-9]+\.email/.test(key)) {
          return value as string;
        }
        if (Object.keys(StaticKeys).includes(key)) {
          return null;
        }
        if (key === 'action') {
          return null;
        }
        if (key.startsWith('$ACTION')) {
          return null;
        }
        ctx.addIssue({
          code: 'unrecognized_keys',
          keys: [key],
          message: 'Unexpected key',
          path: [key],
          fatal: true
        });
        return null;
      })
      .filter((v) => v !== null);
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
      isFinal: input.isFinal ?? false,
      otherPresenters
    };
  });
