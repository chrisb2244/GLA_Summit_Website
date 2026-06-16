'use client';

import { useActionState, useEffect, useReducer, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button } from '../Form/Button';
import { FormField, TextArea } from '../Form/FormFieldSrv';
import { Person } from '../Form/PersonSrv';
import { Select } from '../Form/Select';
import { CharacterCount } from '../Form/CharacterCount';
import {
  PresentationSubmissionFormData,
  PresentationSubmissionFormState
} from './PresentationSubmissionFormSchema';
import { submitPresentationAction } from './presentationSubmissionActions';
import { useFormValidation } from '../Utilities/useFormValidation';
import { useTouchedFieldErrors } from '../Utilities/useTouchedFieldErrors';
import { CAN_SUBMIT_DRAFT } from '@/app/configConstants';
import { Checkbox } from '../Form/Checkbox';
import { SubmitButton } from '../Form/SubmitButton';

type PresentationFormFieldsProps = {
  defaultValues: PresentationSubmissionFormData;
  redirectTo?: string;
};

const TITLE_MAX = 150;
const ABSTRACT_MAX = 5000;
const ABSTRACT_MIN = 100;
const LEARNING_POINTS_MIN = 50;

/**
 * Shared presentation form used for both new submissions and draft editing.
 * This component owns the <form> element, while callers can add surrounding
 * headings, footers, and explanatory text.
 */
export const PresentationFormFields = ({
  defaultValues,
  redirectTo
}: PresentationFormFieldsProps) => {
  const initialState: PresentationSubmissionFormState = {
    data: defaultValues,
    errors: undefined
  };

  const [state, formAction] = useActionState(
    submitPresentationAction,
    initialState
  );
  const values = state.data;
  const isEditingDraft =
    typeof values.presentationId === 'string' &&
    values.presentationId.length > 0;

  const [titleLength, setTitleLength] = useState(values.title.length);
  const [abstractLength, setAbstractLength] = useState(values.abstract.length);
  const [learningPointsLength, setLearningPointsLength] = useState(
    values.learningPoints.length
  );
  // False on the server, true on the client — gates CharacterCount to avoid hydration mismatch.
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);

  const { validationMessages, checkValidity } = useFormValidation();
  const { getFieldError, onBlurFor } = useTouchedFieldErrors<string>({
    validationMessages,
    zodErrors: state.errors
  });

  const submitterErrs = state.errors?.properties?.submitter?.properties ?? {};

  const [otherPresenterFields, otherPresenterArrayDispatcher] = useReducer(
    (
      prevFields: Array<{ id: string; email: string }>,
      action:
        | { type: 'add' }
        | { type: 'remove'; index: number }
        | { type: 'reset'; emails: string[] }
    ) => {
      if (action.type === 'add') {
        return [
          ...prevFields,
          { id: `otherPresenter.${Math.random()}`, email: '' }
        ];
      }
      if (action.type === 'remove') {
        const nextFields = [...prevFields];
        nextFields.splice(action.index, 1);
        return nextFields;
      }
      return action.emails.map((email) => ({
        id: `otherPresenter.${Math.random()}`,
        email
      }));
    },
    values.otherPresenters,
    (initialEmails) =>
      initialEmails.map((email, index) => ({
        id: `otherPresenter.${index}`,
        email
      }))
  );

  useEffect(() => {
    otherPresenterArrayDispatcher({
      type: 'reset',
      emails: values.otherPresenters
    });
  }, [values.otherPresenters]);

  return (
    <form
      action={formAction}
      onChange={(ev) => {
        if (ev.target instanceof HTMLInputElement) {
          checkValidity(ev.target);
        }
      }}
      onInvalidCapture={(ev) => {
        if (ev.target instanceof HTMLInputElement) {
          ev.preventDefault();
          checkValidity(ev.target);
        }
      }}
      className='border border-gray-200 bg-gray-100 p-4 shadow-lg'
    >
      <input type='hidden' name='redirectTo' value={redirectTo ?? ''} />
      <input
        type='hidden'
        name='presentationId'
        value={values.presentationId ?? ''}
      />
      {state.duplicateWarning && (
        <input type='hidden' name='skipDuplicateCheck' value='true' />
      )}

      <Person<PresentationSubmissionFormData>
        heading='Submitter'
        defaultValue={values.submitter}
        locked
        errors={{
          firstName: submitterErrs?.firstName?.errors?.join(', '),
          lastName: submitterErrs?.lastName?.errors?.join(', '),
          email: submitterErrs?.email?.errors?.join(', ')
        }}
        path={'submitter'}
      />

      {otherPresenterFields.map((field, idx) => {
        const presenterPath = `otherPresenters.${idx}.email`;

        return (
          <div className='pb-2' key={field.id}>
            <div className='flex flex-col items-start justify-between sm:flex-row'>
              <div className='flex w-full grow'>
                <div className='flex flex-1'>
                  <FormField
                    name={presenterPath}
                    error={getFieldError(presenterPath, {
                      zodPath: presenterPath
                    })}
                    fullWidth
                    label='Co-presenter Email'
                    defaultValue={field.email}
                    required
                    type='email'
                    onBlur={onBlurFor([presenterPath])}
                  />
                </div>
              </div>
              <div className='ml-auto flex w-1/2 text-center sm:ml-0 sm:w-auto sm:grow-0 sm:p-2'>
                <Button
                  type='button'
                  onClick={() =>
                    otherPresenterArrayDispatcher({
                      type: 'remove',
                      index: idx
                    })
                  }
                  fullWidth
                >
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
          onClick={() => otherPresenterArrayDispatcher({ type: 'add' })}
          fullWidth
        >
          Add co-presenter
        </Button>
      </div>

      <div className='pb-4 pt-8'>
        <FormField
          fullWidth
          placeholder='Presentation Title'
          error={getFieldError('title')}
          label='Title'
          name='title'
          defaultValue={values.title}
          required
          maxLength={TITLE_MAX}
          onInput={(e) => {
            setTitleLength(e.currentTarget.value.length);
          }}
          onBlur={onBlurFor(['title'])}
        />
        {hydrated && <CharacterCount current={titleLength} max={TITLE_MAX} />}

        <TextArea
          name='abstract'
          error={getFieldError('abstract')}
          placeholder='Presentation Abstract - What are you going to talk about?'
          defaultValue={values.abstract}
          fullWidth
          rows={5}
          label='Abstract'
          onInput={(e) => {
            setAbstractLength(e.currentTarget.value.length);
          }}
          onBlur={onBlurFor(['abstract'])}
        />
        {hydrated && (
          <CharacterCount
            current={abstractLength}
            max={ABSTRACT_MAX}
            min={ABSTRACT_MIN}
          />
        )}

        <TextArea
          name='learningPoints'
          error={getFieldError('learningPoints')}
          placeholder='What are the most important things attendees would learn from your presentation?'
          defaultValue={values.learningPoints}
          fullWidth
          rows={3}
          label='Learning Points'
          onInput={(e) => {
            setLearningPointsLength(e.currentTarget.value.length);
          }}
          onBlur={onBlurFor(['learningPoints'])}
        />
        {hydrated && (
          <CharacterCount
            current={learningPointsLength}
            min={LEARNING_POINTS_MIN}
          />
        )}

        <label
          htmlFor='presentationType'
          className='mt-2 block text-sm text-gray-700'
        >
          Presentation Type
        </label>
        <Select
          id='presentationType'
          name='presentationType'
          fullWidth
          defaultValue={values.presentationType}
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

      {state.duplicateWarning && (
        <div
          className='my-3 rounded-md border border-yellow-400 bg-yellow-50 p-3'
          role='alert'
        >
          <p className='font-semibold text-yellow-800'>Possible duplicate</p>
          <p className='text-yellow-700'>
            You already have a submission titled &ldquo;
            {state.duplicateWarning.existingTitle}
            &rdquo;.
          </p>
          <p className='text-yellow-700'>
            If this is a different presentation, click{' '}
            <strong>Submit Anyway</strong>.
          </p>
        </div>
      )}

      {state.status && (
        <div
          className={`my-3 rounded-md border p-3 ${
            state.status.type === 'success'
              ? 'border-green-400 bg-green-50'
              : 'border-red-400 bg-red-50'
          }`}
          role={state.status.type === 'success' ? 'status' : 'alert'}
        >
          <p
            className={
              state.status.type === 'success'
                ? 'text-green-700'
                : 'text-red-700'
            }
          >
            {state.status.message}
          </p>
          {isEditingDraft && state.status.type === 'success' && (
            <p className='mt-1 text-green-700'>
              <Link href='/my-presentations' className='underline'>
                Back to my presentations
              </Link>
            </p>
          )}
        </div>
      )}

      <div className='flex flex-col space-y-1 pb-4 pt-4'>
        <Checkbox
          label={
            <>
              I agree to the GLA Summit{' '}
              <a
                href='/media/codeofconduct.pdf'
                target='_blank'
                rel='noopener noreferrer'
                className='underline'
              >
                code of conduct
              </a>
              , consent to my session being recorded, and consent to my name,
              bio, and (if provided) photograph being published on the
              conference website.
            </>
          }
          name='speakerAgreement'
          defaultChecked={values.speakerAgreement}
        />
        {getFieldError('speakerAgreement', {
          zodPath: 'speakerAgreement',
          requireTouched: false
        }) && (
          <p className='mt-1 text-sm text-red-700' role='alert'>
            {getFieldError('speakerAgreement', {
              zodPath: 'speakerAgreement',
              requireTouched: false
            })}
          </p>
        )}
      </div>

      <p className='pb-4 text-sm text-gray-600 max-w-prose px-2'>
        Before presenting, please read our{' '}
        <a
          href='/media/presenterguidelines.pdf'
          target='_blank'
          rel='noopener noreferrer'
          className='underline'
        >
          presenter guidelines
        </a>
        . Please note that this document is currently being reviewed and may be
        slightly out of date.
      </p>

      <div className='mt-3 flex flex-col gap-2 sm:flex-row sm:justify-between'>
        {CAN_SUBMIT_DRAFT && (
          <div className='w-full sm:w-2/5'>
            <Button
              type='submit'
              name='submitIntent'
              value='saveDraft'
              fullWidth
            >
              Save Draft
            </Button>
          </div>
        )}

        <div className={CAN_SUBMIT_DRAFT ? 'w-full sm:w-3/5' : 'w-full'}>
          <SubmitButton
            name='submitIntent'
            value='submit'
            staticText={
              state.duplicateWarning ? 'Submit Anyway' : 'Submit Presentation'
            }
            pendingText={
              state.duplicateWarning ? 'Submitting anyway...' : 'Submitting...'
            }
          />
        </div>
      </div>
    </form>
  );
};
