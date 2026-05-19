'use client';

import { Button } from '../Form/Button';
import { SubmitButton } from '../Form/SubmitButton';
import { PersonProps } from '../Form/Person';
import { Checkbox } from '../Form/Checkbox';
import { useFieldArray, useForm } from 'react-hook-form';
import { submitNewPresentation } from '@/actions/presentationSubmission';
import { CAN_SUBMIT_DRAFT } from '@/app/configConstants';
import { PresentationFormFields } from './PresentationFormFields';
import { PresentationBaseFormData } from './PresentationFormShared';
import NextLink from 'next/link';
import { useState } from 'react';

type PresentationSubmissionFormProps = {
  submitter: PersonProps;
};

export type SubmissionFormData = PresentationBaseFormData;

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
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [lastSubmissionWasFinal, setLastSubmissionWasFinal] = useState(true);

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
  const staticSubmitText = isFinal ? 'Submit Presentation' : 'Save Draft';
  const pendingSubmitText = isFinal ? 'Submitting now...' : 'Saving now...';

  if (submissionSuccess) {
    return (
      <div className='my-4 rounded-md border border-green-400 bg-green-50 p-4'>
        <p className='font-semibold text-green-800'>
          {lastSubmissionWasFinal
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
              href={`/my-presentations`}
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
        onSubmit={async (event) => {
          event.preventDefault();
          const formElement = event.currentTarget;
          const formValid = await trigger();
          if (formValid) {
            const data = new FormData(formElement);
            const submissionWasFinal = data.get('isFinal') === 'on';
            if (bypassDuplicateCheck) {
              data.append('skipDuplicateCheck', 'true');
            }
            const result = await submitNewPresentation(data);
            if (result.success) {
              setLastSubmissionWasFinal(submissionWasFinal);
              resetForm();
              setDuplicateWarning(null);
              setBypassDuplicateCheck(false);
              setSubmissionError(null);
              setSubmissionSuccess(true);
            } else if ('isDuplicate' in result && result.isDuplicate) {
              setDuplicateWarning({
                id: result.existingId,
                title: result.existingTitle
              });
              setBypassDuplicateCheck(true);
              setSubmissionError(null);
            } else if ('error' in result) {
              setSubmissionError(result.error.message);
            }
          } else {
            const firstError = Object.entries(errors).find(([, err]) => {
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
        {submissionError && (
          <p className='my-2 text-sm text-red-700' role='alert'>
            {submissionError}
          </p>
        )}
        <div className='border border-gray-200 bg-gray-100 p-2 shadow-lg'>
          <PresentationFormFields
            register={register}
            errors={errors}
            control={control}
            watch={watch}
            submitter={props.submitter}
            otherPresenterFields={otherPresenterFields}
            addPresenter={addPresenter}
            removePresenter={removePresenter}
          />
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
            <div className='flex flex-col space-y-1 pt-4 pb-6'>
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
              formAction={submitNewPresentation}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

