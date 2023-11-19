'use client';

import { Button } from '../Form/Button';
import { SubmitButton } from '../Form/SubmitButton';
import { EmailProps, Person, PersonProps } from '../Form/Person';
import { Checkbox } from '../Form/Checkbox';
import { useFieldArray, useForm } from 'react-hook-form';
import { submitNewPresentation } from '@/actions/presentationSubmission';
import { FormField, TextArea } from '../Form/FormField';
import type { PresentationType } from '@/lib/databaseModels';
import { Select } from '../Form/Select';
import { EmailArrayFormComponent } from '../Form/EmailArray';
import { zodResolver } from '@hookform/resolvers/zod';
import { PresentationSubmissionFormSchema } from './PresentationSubmissionFormSchema';

type PresentationSubmissionFormProps = {
  submitter: PersonProps;
};

type SubmissionFormData = {
  submitter: PersonProps;
  otherPresenters: EmailProps[];
  isFinal: boolean;
  title: string;
  abstract: string;
  learningPoints: string;
  presentationType: PresentationType;
};

export const PresentationSubmissionForm = (
  props: PresentationSubmissionFormProps
) => {
  const readyLabel =
    'I am ready to submit this presentation (leave unchecked to save a draft)';

  const {
    register,
    formState: { errors },
    control,
    handleSubmit,
    watch
  } = useForm<SubmissionFormData>({
    mode: 'onTouched',
    defaultValues: {
      submitter: props.submitter,
      isFinal: false,
      title: '',
      abstract: '',
      learningPoints: '',
      presentationType: 'full length',
      otherPresenters: []
    }
    // resolver: zodResolver(PresentationSubmissionFormSchema)
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

  // handle locking the form (default values, readOnly / FormFieldIndicator?)
  const lockProps = {
    readOnly: false
  };

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
      <form
        action={submitNewPresentation}
        onSubmit={handleSubmit((d) => {
          console.log(d);
        })}
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
          <EmailArrayFormComponent<SubmissionFormData>
            arrayPath={'otherPresenters'}
            emailArray={otherPresenterFields}
            errors={errors.otherPresenters}
            register={register}
            removePresenter={removePresenter}
            label='Co-presenter Email'
          />
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
              registerReturn={register('title', { required: 'Required' })}
              fullWidth
              placeholder='Presentation Title'
              fieldError={errors.title}
              label='Title'
              {...lockProps}
            />
            <TextArea
              registerReturn={register('abstract', {
                required: 'Required',
                minLength: {
                  value: 100,
                  message: 'This field has a minimum length of 100 characters'
                },
                maxLength: {
                  value: 5000,
                  message: 'This field has a maximum length of 5000 characters'
                }
              })}
              fieldError={errors.abstract}
              placeholder='Presentation Abstract'
              fullWidth
              rows={5}
              label='Abstract'
              {...lockProps}
            />
            <TextArea
              registerReturn={register('learningPoints', {
                required: 'Required',
                minLength: {
                  value: 50,
                  message: 'This field has a minimum length of 50 characters'
                }
              })}
              fieldError={errors.learningPoints}
              placeholder='What are the most important things attendees would learn from your presentation?'
              fullWidth
              rows={3}
              label='Learning Points'
              {...lockProps}
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
            <Checkbox label={readyLabel} {...register('isFinal')} />
            <SubmitButton
              staticText={staticSubmitText}
              pendingText={pendingSubmitText}
            />
          </div>
        </div>
      </form>
    </div>
  );
};
