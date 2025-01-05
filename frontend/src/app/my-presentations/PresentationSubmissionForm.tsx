'use client';

import { Button } from '@/Components/Form/Button';
import { SubmitButton } from '@/Components/Form/SubmitButton';
import { Person, PersonProps } from '@/Components/Form/Person';
// import { Checkbox } from '../Form/Checkbox';
// import { submitNewPresentation } from '@/actions/presentationSubmission';
import { submitNewPresentation } from './PresentationSubmissionActions';

import { FormField, TextArea } from '@/Components/Form/FormFieldSrv';
import { Select } from '@/Components/Form/Select';
import { useActionState } from 'react';

type PresentationSubmissionFormProps = {
  submitter: PersonProps;
};

export const PresentationSubmissionForm = (
  props: PresentationSubmissionFormProps
) => {
  // const readyLabel =
  //   'I am ready to submit this presentation (leave unchecked to save a draft)';

  const isFinal = true; // watch('isFinal');
  const staticSubmitText = isFinal ? 'Submit Presentation' : 'Save Draft';
  const pendingSubmitText = isFinal ? 'Submitting now...' : 'Saving now...';

  // handle locking the form (default values, readOnly / FormFieldIndicator?)
  const lockProps = {
    readOnly: false
  };

  const [formState, formAction] = useActionState(submitNewPresentation, {
    data: {
      submitter: props.submitter,
      isFinal: true,
      title: '',
      abstract: '',
      learningPoints: '',
      presentationType: 'full length',
      otherPresenters: []
    }
  });
  const otherPresenters = formState.data.otherPresenters ?? [];

  return (
    <div className='prose'>
      <noscript>
        <style>{`.js-only { display: none }`}</style>
      </noscript>
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
        action={formAction}
        // onSubmit={handleSubmit(onSubmit)}
      >
        <input type='hidden' name='action' value='submit' />
        <div className='border border-gray-200 bg-gray-100 p-2 shadow-lg'>
          <Person
            heading='Submitter'
            defaultValue={props.submitter}
            locked
            errors={undefined}
            path={'submitter'}
          />
          {otherPresenters.map((email, idx) => {
            return (
              <div className='js-only pb-2' key={`otherPresenters.${idx}`}>
                <div className='flex flex-col items-start justify-between sm:flex-row'>
                  <div className='flex w-full flex-grow'>
                    <div className='flex flex-1'>
                      <div className='flex flex-1'>
                        <FormField
                          name={`otherPresenters.${idx}.email`}
                          required
                          type='email'
                          error={formState.errors?.otherPresenters?.[idx]}
                          fullWidth
                          label='Co-presenter Email'
                          defaultValue={email}
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    className={`ml-auto flex w-1/2 text-center sm:ml-0 sm:w-auto sm:flex-grow-0 sm:p-2`}
                  >
                    <Button
                      // onClick={() => {}}
                      // formAction={otherPresentersAction}
                      fullWidth
                      formNoValidate={true}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          <noscript>
            <p>
              No javascript - enter other presenters as a semicolon-separated
              list
            </p>
            <FormField
              name='otherPresentersList'
              label='Co-presenter Emails (semicolon-separated)'
              defaultValue={formState.data.otherPresentersList}
              fullWidth
              error={formState.errors?.otherPresentersList}
              {...lockProps}
            />
          </noscript>
          <div className='js-only mx-auto -mb-6 mt-1 w-1/2'>
            <Button
              // onClick={() => {
              //   // addPresenter({ email: '' });
              // }}
              // formAction={otherPresentersAction}
              formNoValidate={true}
              fullWidth
            >
              Add co-presenter
            </Button>
          </div>
          <div className='py-8'>
            <FormField
              required
              name='title'
              label='Title'
              fullWidth
              placeholder='Presentation Title'
              error={formState.errors?.title}
              {...lockProps}
            />
            <TextArea
              name='abstract'
              required
              minLength={100}
              maxLength={5000}
              error={formState.errors?.abstract}
              placeholder='Presentation Abstract - What are you going to talk about?'
              fullWidth
              rows={5}
              label='Abstract'
              {...lockProps}
            />
            <TextArea
              name='learningPoints'
              required
              minLength={50}
              error={formState.errors?.learningPoints}
              placeholder='What are the most important things attendees would learn from your presentation?'
              fullWidth
              rows={3}
              label='Learning Points'
              {...lockProps}
            />
            <Select
              fullWidth
              name='presentationType'
              // {...register('presentationType')}
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
