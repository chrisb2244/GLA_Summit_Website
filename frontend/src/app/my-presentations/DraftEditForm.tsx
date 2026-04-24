'use client';

import { Button } from '@/Components/Form/Button';
import { PersonProps } from '@/Components/Form/Person';
import { Checkbox } from '@/Components/Form/Checkbox';
import { PresentationFormFields } from '@/Components/Forms/PresentationFormFields';
import { PresentationBaseFormData } from '@/Components/Forms/PresentationFormShared';
import {
  deleteDraftPresentation,
  updateDraftPresentation
} from '@/actions/presentationSubmission';
import { useFieldArray, useForm } from 'react-hook-form';
import { CenteredDialog } from '@/Components/CenteredDialog';
import { CAN_SUBMIT_PRESENTATION } from '@/app/configConstants';
import NextLink from 'next/link';
import { useRef, useState, useTransition } from 'react';

type DraftEditFormProps = {
  presentationId: string;
  submitter: PersonProps;
  defaultValues: PresentationBaseFormData;
};

export const DraftEditForm = ({
  presentationId,
  submitter,
  defaultValues
}: DraftEditFormProps) => {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isPendingSave, startSaveTransition] = useTransition();
  const [isPendingSubmit, startSubmitTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    formState: { errors },
    control,
    setFocus,
    watch,
    trigger
  } = useForm<PresentationBaseFormData>({
    mode: 'onTouched',
    defaultValues
  });

  const {
    fields: otherPresenterFields,
    append: addPresenter,
    remove: removePresenter
  } = useFieldArray<PresentationBaseFormData, 'otherPresenters'>({
    name: 'otherPresenters',
    control
  });

  const handleSaveDraft = () => {
    startSaveTransition(async () => {
      setActionError(null);
      const formData = new FormData(formRef.current!);
      formData.set('presentationId', presentationId);
      formData.delete('isFinal');
      const result = await updateDraftPresentation(formData);
      if (result.success) {
        setSaveSuccess(true);
      } else {
        setActionError(result.error.message);
      }
    });
  };

  const handleSubmitFinal = () => {
    startSubmitTransition(async () => {
      setActionError(null);
      const formValid = await trigger();
      if (!formValid) {
        const firstError = Object.entries(errors).find(
          ([_, err]) => err !== null && typeof err !== 'undefined'
        );
        if (typeof firstError?.[0] === 'string') {
          setFocus(firstError[0] as keyof PresentationBaseFormData, {
            shouldSelect: true
          });
        }
        return;
      }
      const formData = new FormData(formRef.current!);
      formData.set('presentationId', presentationId);
      formData.set('isFinal', 'on');
      const result = await updateDraftPresentation(formData);
      if (result.success) {
        setSubmitSuccess(true);
      } else {
        setActionError(result.error.message);
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteDraftPresentation(presentationId);
      setConfirmDeleteOpen(false);
      if (!result.success) {
        setActionError(result.error.message);
      } else {
        window.location.href = '/my-presentations';
      }
    });
  };

  if (saveSuccess) {
    return (
      <div className='my-4 rounded-md border border-green-400 bg-green-50 p-4'>
        <p className='font-semibold text-green-800'>Draft saved successfully!</p>
        <div className='mt-3 flex gap-2'>
          <Button type='button' onClick={() => setSaveSuccess(false)}>
            Keep editing
          </Button>
          <NextLink
            href='/my-presentations'
            className='rounded border border-gray-400 bg-gray-200 p-2 text-sm shadow-md'
          >
            Back to My Presentations
          </NextLink>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className='my-4 rounded-md border border-green-400 bg-green-50 p-4'>
        <p className='font-semibold text-green-800'>
          Presentation submitted successfully!
        </p>
        <p className='mt-1 text-green-700'>
          Don&apos;t forget to update your bio and profile photo at{' '}
          <NextLink href='/my-profile' className='underline'>
            My Profile
          </NextLink>{' '}
          — these will be shown in the conference programme.
        </p>
        <div className='mt-3'>
          <NextLink
            href='/my-presentations'
            className='rounded border border-gray-400 bg-gray-200 p-2 text-sm shadow-md'
          >
            Back to My Presentations
          </NextLink>
        </div>
      </div>
    );
  }

  const isPending = isPendingSave || isPendingSubmit;

  return (
    <div className='prose'>
      <p>Edit your draft presentation below.</p>
      <p>
        Adding a co-presenter will email them an invitation if they don&apos;t
        already have an account.
      </p>

      {actionError && (
        <div
          className='my-3 rounded-md border border-red-400 bg-red-50 p-3'
          role='alert'
        >
          <p className='text-red-700'>{actionError}</p>
        </div>
      )}

      <form ref={formRef}>
        <div className='border border-gray-200 bg-gray-100 p-2 shadow-lg'>
          <PresentationFormFields
            register={register}
            errors={errors}
            control={control}
            watch={watch}
            submitter={submitter}
            otherPresenterFields={otherPresenterFields}
            addPresenter={addPresenter}
            removePresenter={removePresenter}
          />
          <div className='mt-2 rounded border border-gray-300 bg-white p-3'>
            <Checkbox
              label='I agree to the GLA Summit speaker agreement, consent to my session being recorded, and consent to my name, bio, and (if provided) photograph being published on the conference website.'
              {...register('speakerAgreement', {
                required: CAN_SUBMIT_PRESENTATION
                  ? 'You must agree to the speaker agreement to submit.'
                  : false
              })}
            />
            {errors.speakerAgreement && (
              <p className='mt-1 text-sm text-red-700' role='alert'>
                {errors.speakerAgreement.message}
              </p>
            )}
          </div>
          <div className='mt-3 flex flex-col gap-2 sm:flex-row sm:justify-between'>
            <div className='flex gap-2'>
              <Button
                type='button'
                onClick={handleSaveDraft}
                disabled={isPending}
              >
                {isPendingSave ? 'Saving...' : 'Save Draft'}
              </Button>
              {CAN_SUBMIT_PRESENTATION && (
                <Button
                  type='button'
                  onClick={handleSubmitFinal}
                  disabled={isPending}
                >
                  {isPendingSubmit ? 'Submitting...' : 'Submit Presentation'}
                </Button>
              )}
            </div>
            <Button
              type='button'
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={isPending}
            >
              Delete Draft
            </Button>
          </div>
        </div>
      </form>

      <CenteredDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <p className='mb-4 font-semibold'>Delete this draft?</p>
        <p className='mb-4 text-gray-700'>
          This draft will be permanently deleted. This cannot be undone.
        </p>
        <div className='flex justify-end gap-2'>
          <button
            type='button'
            onClick={() => setConfirmDeleteOpen(false)}
            disabled={isDeleting}
            className='rounded border border-gray-300 px-4 py-1 hover:bg-gray-50 disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleDelete}
            disabled={isDeleting}
            className='rounded bg-red-600 px-4 py-1 text-white hover:bg-red-700 disabled:opacity-50'
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </CenteredDialog>
    </div>
  );
};

