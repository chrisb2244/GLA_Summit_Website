'use client';

import {
  Control,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormRegister,
  UseFormWatch,
  FieldArrayWithId
} from 'react-hook-form';
import { Button } from '../Form/Button';
import { FormField, TextArea } from '../Form/FormField';
import { Person, PersonProps, EmailProps } from '../Form/Person';
import { Select } from '../Form/Select';
import { CharacterCount } from '../Form/CharacterCount';
import {
  PresentationBaseFormData,
  ABSTRACT_MAX,
  ABSTRACT_MIN,
  LEARNING_POINTS_MIN,
  TITLE_MAX
} from './PresentationFormShared';

type PresentationFormFieldsProps = {
  register: UseFormRegister<PresentationBaseFormData>;
  errors: FieldErrors<PresentationBaseFormData>;
  control: Control<PresentationBaseFormData>;
  watch: UseFormWatch<PresentationBaseFormData>;
  submitter: PersonProps;
  otherPresenterFields: FieldArrayWithId<
    PresentationBaseFormData,
    'otherPresenters'
  >[];
  addPresenter: UseFieldArrayAppend<PresentationBaseFormData, 'otherPresenters'>;
  removePresenter: UseFieldArrayRemove;
};

/**
 * The core editable fields shared between the new-submission form and the
 * draft-edit form.  Contains: submitter (read-only), co-presenters, title,
 * abstract, learning points, and presentation type.
 */
export const PresentationFormFields = ({
  register,
  errors,
  watch,
  submitter,
  otherPresenterFields,
  addPresenter,
  removePresenter
}: PresentationFormFieldsProps) => {
  const titleValue = watch('title');
  const abstractValue = watch('abstract');
  const learningPointsValue = watch('learningPoints');

  return (
    <>
      <Person<PresentationBaseFormData>
        heading='Submitter'
        defaultValue={submitter}
        locked
        errors={errors.submitter}
        path={'submitter'}
        register={register}
      />
      {otherPresenterFields.map((field, idx) => (
        <div className='pb-2' key={field.id}>
          <div className='flex flex-col items-start justify-between sm:flex-row'>
            <div className='flex w-full flex-grow'>
              <div className='flex flex-1'>
                <FormField
                  registerReturn={register(`otherPresenters.${idx}.email`, {
                    required: 'Required',
                    pattern: {
                      value: /^\S+@\S+\.\S+$/i,
                      message: "This email doesn't match the expected pattern"
                    }
                  })}
                  fieldError={errors.otherPresenters?.[idx]?.email}
                  fullWidth
                  label='Co-presenter Email'
                  defaultValue=''
                />
              </div>
            </div>
            <div className='ml-auto flex w-1/2 text-center sm:ml-0 sm:w-auto sm:flex-grow-0 sm:p-2'>
              <Button onClick={() => removePresenter(idx)} fullWidth>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ))}
      <div className='mx-auto -mb-6 mt-1 w-1/2'>
        <Button
          type='button'
          onClick={() => addPresenter({ email: '' })}
          fullWidth
        >
          Add co-presenter
        </Button>
      </div>
      <div className='pt-8 pb-4'>
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
          readOnly={false}
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
          readOnly={false}
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
          readOnly={false}
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
    </>
  );
};
