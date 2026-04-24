'use client';

import { Button } from '../Form/Button';
import { SubmitButton } from '../Form/SubmitButton';
import { EmailProps, Person, PersonProps } from '../Form/Person';
import { Checkbox } from '../Form/Checkbox';
import { CharacterCount } from '../Form/CharacterCount';
import { useFieldArray, useForm } from 'react-hook-form';
import { submitNewPresentation } from '@/actions/presentationSubmission';
import { FormField, TextArea } from '../Form/FormField';
import type { PresentationType } from '@/lib/databaseModels';
import { Select } from '../Form/Select';
import { CAN_SUBMIT_DRAFT } from '@/app/configConstants';
import NextLink from 'next/link';
import { useState } from 'react';

type PresentationSubmissionFormProps = {
  submitter: PersonProps;
};

export type SubmissionFormData = {
  submitter: PersonProps;
  otherPresenters: EmailProps[];
  isFinal: boolean;
  speakerAgreement: boolean;
  title: string;
  abstract: string;
  learningPoints: string;
  presentationType: PresentationType;
};

const TITLE_MAX = 150;
const ABSTRACT_MAX = 5000;
const ABSTRACT_MIN = 100;
const LEARNING_POINTS_MIN = 50;

export const PresentationSubmissionForm = (
  props: PresentationSubmissionFormProps
) => {
  const readyLabel =
    'I am ready to submit this presentation (leave unchecked to save a draft)';

  const [duplicateWarning, setDuplicateWarning] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [bypassDuplicateCheck, setBypassDuplicateCheck] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const {
    register,
    formState: { errors },
    control,
    setFocus,
    watch,
    trigger,
    reset: resetForm
  } = useForm<SubmissionFormData>({
    mode: 'onTouched',
    defaultValues: {
      submitter: props.submitter,
      isFinal: true,
      speakerAgreement: false,
      title: '',
      abstract: '',
      learningPoints: '',
      presentationType: 'full length',
      otherPresenters: []
    }
  });

  const {
    fields: otherPresenterFields,
    append: addPresenter,
    remove: removePresenter
  } = useFieldArray<SubmissionFormData, 'otherPresenters'>({
    name: 'otherPresenters',
    control
  });

  const isFinal = watch('isFinal');
  const titleValue = watch('title');
  const abstractValue = watch('abstract');
  const learningPointsValue = watch('learningPoints');
  const staticSubmitText = isFinal ? 'Submit Presentation' : 'Save Draft';
  const pendingSubmitText = isFinal ? 'Submitting now...' : 'Saving now...';

  const lockProps = {
    readOnly: false
  };

  if (submissionSuccess) {
    return (
      <div className='my-4 rounded-md border border-green-400 bg-green-50 p-4'>
        <p className='font-semibold text-green-800'>
          {isFinal
            ? 'Presentation submitted successfully!'
            : 'Draft saved successfully!'}
        </p>
        <p className='mt-1 text-green-700'>
          Don&apos;t forget to update your bio and profile photo at{' '}
          <NextLink href='/my-profile' className='underline'>
            My Profile
          </NextLink>{' '}
          — these will be shown in the conference programme.
        </p>
        <Button
          type='button'
          onClick={() => {
            setSubmissionSuccess(false);
            setDuplicateWarning(null);
            setBypassDuplicateCheck(false);
          }}
        >
          Submit another presentation
        </Button>
      </div>
    );
  }

  return (
    <div className='prose'>
      <p>Please enter the information below and submit your presentation!</p>
      <p>
        Any additional presenters that you add here will be emailed inviting
        them to create an account, if they don&apos;t have one already, and to
        join this presentation.
        <br />
        Only you, the presentation submitter, will be able to edit the
        presentation.
      </p>

      {duplicateWarning && (
        <div
          className='my-3 rounded-md border border-yellow-400 bg-yellow-50 p-3'
          role='alert'
        >
          <p className='font-semibold text-yellow-800'>Possible duplicate</p>
          <p className='text-yellow-700'>
            You already have a submission titled &ldquo;{duplicateWarning.title}
            &rdquo;.{' '}
            <NextLink
              href={`/presentations/${duplicateWarning.id}`}
              className='underline'
            >
              View existing submission
            </NextLink>
            .
          </p>
          <p className='text-yellow-700'>
            If this is a different presentation, click{' '}
            <strong>Submit Anyway</strong> to proceed.
          </p>
        </div>
      )}

      <form
        action={async (data: FormData) => {
          const formValid = await trigger();
          if (formValid) {
            if (bypassDuplicateCheck) {
              data.append('skipDuplicateCheck', 'true');
            }
            const result = await submitNewPresentation(data);
            if (result.success) {
              resetForm();
              setDuplicateWarning(null);
              setBypassDuplicateCheck(false);
              setSubmissionSuccess(true);
            } else if ('isDuplicate' in result && result.isDuplicate) {
              setDuplicateWarning({
                id: result.existingId,
                title: result.existingTitle
              });
              setBypassDuplicateCheck(true);
            } else if ('error' in result) {
              console.error(result.error);
            }
          } else {
            const firstError = Object.entries(errors).find(([_, err]) => {
              return err !== null && typeof err !== 'undefined';
            });
            if (typeof firstError?.[0] === 'string') {
              setFocus(firstError[0] as keyof SubmissionFormData, {
                shouldSelect: true
              });
            }
          }
        }}
      >
        <div className='border border-gray-200 bg-gray-100 p-2 shadow-lg'>
          <Person<SubmissionFormData>
            heading='Submitter'
            defaultValue={props.submitter}
            locked
            errors={errors.submitter}
            path={'submitter'}
            register={register}
          />
          {otherPresenterFields.map((field, idx) => {
            return (
              <div className='pb-2' key={field.id}>
                <div className='flex flex-col items-start justify-between sm:flex-row'>
                  <div className='flex w-full flex-grow'>
                    <div className='flex flex-1'>
                      <div className='flex flex-1'>
                        <FormField
                          registerReturn={register(
                            `otherPresenters.${idx}.email`,
                            {
                              required: 'Required',
                              pattern: {
                                value: /^\S+@\S+\.\S+$/i,
                                message:
                                  "This email doesn't match the expected pattern"
                              }
                            }
                          )}
                          fieldError={errors.otherPresenters?.[idx]?.email}
                          fullWidth
                          label='Co-presenter Email'
                          defaultValue=''
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    className={`ml-auto flex w-1/2 text-center sm:ml-0 sm:w-auto sm:flex-grow-0 sm:p-2`}
                  >
                    <Button onClick={() => removePresenter(idx)} fullWidth>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          <div className='mx-auto -mb-6 mt-1 w-1/2'>
            <Button
              type='button'
              onClick={() => {
                addPresenter({ email: '' });
              }}
              fullWidth
            >
              Add co-presenter
            </Button>
          </div>
          <div className='py-8'>
            <FormField
              registerReturn={register('title', {
                required: 'Required',
                maxLength: {
                  value: TITLE_MAX,
                  message: `Title must be ${TITLE_MAX} characters or fewer`
                }
              })}
              fullWidth
              placeholder='Presentation Title'
              fieldError={errors.title}
              label='Title'
              {...lockProps}
            />
            <CharacterCount current={titleValue.length} max={TITLE_MAX} />
            <TextArea
              registerReturn={register('abstract', {
                required: 'Required',
                minLength: {
                  value: ABSTRACT_MIN,
                  message: `This field has a minimum length of ${ABSTRACT_MIN} characters`
                },
                maxLength: {
                  value: ABSTRACT_MAX,
                  message: `This field has a maximum length of ${ABSTRACT_MAX} characters`
                }
              })}
              fieldError={errors.abstract}
              placeholder='Presentation Abstract - What are you going to talk about?'
              fullWidth
              rows={5}
              label='Abstract'
              {...lockProps}
            />
            <CharacterCount
              current={abstractValue.length}
              max={ABSTRACT_MAX}
              min={ABSTRACT_MIN}
            />
            <TextArea
              registerReturn={register('learningPoints', {
                required: 'Required',
                minLength: {
                  value: LEARNING_POINTS_MIN,
                  message: `This field has a minimum length of ${LEARNING_POINTS_MIN} characters`
                }
              })}
              fieldError={errors.learningPoints}
              placeholder='What are the most important things attendees would learn from your presentation?'
              fullWidth
              rows={3}
              label='Learning Points'
              {...lockProps}
            />
            <CharacterCount
              current={learningPointsValue.length}
              min={LEARNING_POINTS_MIN}
            />
            <Select
              fullWidth
              {...register('presentationType')}
              options={[
                {
                  key: 'full length',
                  description: 'Full Length Presentation (45 minutes)'
                },
                {
                  key: '15 minutes',
                  description: 'Short Presentation (15 minutes)'
                },
                {
                  key: '7x7',
                  description: '7x7 Presentation (7 minutes)'
                }
              ]}
            />
          </div>
          <div className='flex flex-col space-y-1'>
            {CAN_SUBMIT_DRAFT ? (
              <Checkbox
                label={readyLabel}
                {...register('isFinal')}
                defaultChecked
              />
            ) : (
              <input type='hidden' name='isFinal' value='on' />
            )}
            <div className='mt-2 rounded border border-gray-300 bg-white p-3'>
              <Checkbox
                label='I agree to the GLA Summit speaker agreement, consent to my session being recorded, and consent to my name, bio, and (if provided) photograph being published on the conference website.'
                {...register('speakerAgreement', {
                  required:
                    'You must agree to the speaker agreement to submit.'
                })}
              />
              {errors.speakerAgreement && (
                <p className='mt-1 text-sm text-red-700' role='alert'>
                  {errors.speakerAgreement.message}
                </p>
              )}
            </div>
            <SubmitButton
              staticText={duplicateWarning ? 'Submit Anyway' : staticSubmitText}
              pendingText={pendingSubmitText}
            />
          </div>
        </div>
      </form>
    </div>
  );
};
