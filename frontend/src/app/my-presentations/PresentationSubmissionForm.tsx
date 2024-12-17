'use client';

import { Button } from '@/Components/Form/Button';
import { SubmitButton } from '@/Components/Form/SubmitButton';
import { EmailProps, Person, PersonProps } from '@/Components/Form/Person';
// import { Checkbox } from '../Form/Checkbox';
import { useFieldArray, useForm } from 'react-hook-form';
import { submitNewPresentation } from '@/actions/presentationSubmission';
import { FormField, TextArea } from '@/Components/Form/FormField';
import type { SubmissionFormData } from './PresentationSubmissionActions';
import { Select } from '@/Components/Form/Select';

type PresentationSubmissionFormProps = {
  submitter: PersonProps;
};

export const PresentationSubmissionForm = (
  props: PresentationSubmissionFormProps
) => {
  // const readyLabel =
  //   'I am ready to submit this presentation (leave unchecked to save a draft)';

  const {
    register,
    formState: { errors },
    control,
    setFocus,
    watch,
    trigger,
    reset: resetForm,
    handleSubmit
  } = useForm<SubmissionFormData>({
    mode: 'onTouched',
    defaultValues: {
      submitter: props.submitter,
      isFinal: true,
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

  // handle locking the form (default values, readOnly / FormFieldIndicator?)
  const lockProps = {
    readOnly: false
  };

  const onSubmit = (data: SubmissionFormData) => {
    console.log(data);
  };

  return (
    <div className='prose'>
      <p>Please enter the information below and submit your presentation!</p>
      <p>
        Any additional presenters that you add here will be emailed inviting
        them to create an account, if they don&apos;t have one already, and to
        join this presentation.
        {/* <br />
        Only you, the presentation submitter, will be able to edit the
        presentation. */}
      </p>
      <form
        action={async (data: FormData) => {
          const formValid = await trigger();
          if (formValid) {
            const result = await submitNewPresentation(data);
            if (result.success) {
              resetForm();
            } else {
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
        onSubmit={handleSubmit(onSubmit)}
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
                                value:
                                  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                message: 'Invalid email address'
                              }
                            }
                          )}
                          type='email'
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
                required: 'Required'
              })}
              name='title'
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
              placeholder='Presentation Abstract - What are you going to talk about?'
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
            <input type='hidden' name='isFinal' value='on' />
            {/* <Checkbox label={readyLabel} {...register('isFinal')} /> */}
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
