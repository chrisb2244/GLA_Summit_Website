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
  otherPresenters: z.array(z.string().email()).optional(),
  otherPresentersList: z.string().optional()
});
const StaticKeys = StaticPresentationFormSchema.shape;

const getPresentersFromList = (
  list: string | undefined,
  ctx: z.RefinementCtx
) => {
  const resultList = list
    ? list.split(';').map((str) => {
        const result = z.string().email().safeParse(str.trim());
        if (result.success) {
          return result.data;
        }
        ctx.addIssue({
          code: 'invalid_string',
          message: 'Invalid email',
          validation: 'email',
          path: ['otherPresentersList']
        });
        return null;
      })
    : [];
  return resultList.filter((v) => v !== null);
};

export const OtherPresentersSchema = z
  .object({
    otherPresenters: z.array(z.string().email()).optional(),
    otherPresentersList: z.string().optional()
  })
  .catchall(z.any())
  .transform((input, ctx) => {
    const otherPresentersFromList = getPresentersFromList(
      input.otherPresentersList,
      ctx
    );
    const otherPresentersFromEntries = Object.entries(input)
      .map(([key, value]) => {
        if (/otherPresenters\.[0-9]+\.email/.test(key)) {
          return value as string;
        }
        return null;
      })
      .filter((v) => v !== null);
    const otherPresenters = [
      ...otherPresentersFromList,
      ...otherPresentersFromEntries
    ];
    return {
      otherPresenters
    };
  });

export const PresentationSubmissionFormSchema =
  StaticPresentationFormSchema.catchall(z.any()).transform((input, ctx) => {
    const otherPresentersFromList = getPresentersFromList(
      input.otherPresentersList,
      ctx
    );

    const otherPresentersFromEntries = Object.entries(input)
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
      otherPresenters: [
        ...otherPresentersFromList,
        ...otherPresentersFromEntries
      ]
    };
  });

export type PresentationSubmissionData = z.infer<
  typeof PresentationSubmissionFormSchema
>;
