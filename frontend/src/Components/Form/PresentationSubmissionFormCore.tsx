import { Button, Paper, MenuItem, TextFieldProps, Box } from '@mui/material'
import {
  of,
  UseFormRegister,
  UseFieldArrayAppend,
  FieldErrors,
  UseFieldArrayRemove,
  FieldArrayWithId
} from 'react-hook-form'
import { EmailProps, Person, PersonProps } from '@/Components/Form/Person'
import { StackedBoxes } from '../Layout/StackedBoxes'
import { EmailArrayFormComponent } from './EmailArray'
import { FormField } from './FormField'

import { PresentationType } from '@/lib/databaseModels'

export type FormData = {
  submitter: PersonProps
  otherPresenters: EmailProps[]
  title: string
  abstract: string
  learningPoints: string
  presentationType: PresentationType
  timeWindows: { windowStartTime: Date; windowEndTime: Date }[]
  isFinal: boolean
}

export type PresentationLockedStatus = {
  isCopresenter: boolean
  isSubmitted: boolean
} //'unlocked' | 'copresenter' | 'submitted'
export const isLocked = (status: PresentationLockedStatus) => {
  return status.isCopresenter || status.isSubmitted
}

type PresentationFormCoreProps = {
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
  addPresenter: UseFieldArrayAppend<FormData, 'otherPresenters'>
  removePresenter: UseFieldArrayRemove
  otherPresenters: FieldArrayWithId<FormData, 'otherPresenters'>[]
  submitter: PersonProps
  displayLabels?: boolean
  initialPresentationType?: PresentationType
  lockStatuses?: PresentationLockedStatus
}

export const PresentationSubmissionFormCore: React.FC<
  PresentationFormCoreProps
> = ({
  register,
  errors,
  addPresenter,
  removePresenter,
  submitter,
  otherPresenters,
  initialPresentationType = 'full length',
  displayLabels = false,
  lockStatuses = { isCopresenter: false, isSubmitted: false }
}) => {
  const locked = isLocked(lockStatuses)
  const displayLocked = locked ? { display: 'none' } : {}
  const lockProps = locked
    ? {
        InputProps: {
          readOnly: true
        },
        variant: 'filled' as TextFieldProps['variant']
      }
    : {}

    return (
    <>
      <Paper>
        <Box px={1} py={2} mb={1}>
          <Person<FormData>
            heading='Submitter'
            defaultValue={submitter}
            errors={errors.submitter}
            register={register}
            path={of('submitter')}
            locked={true}
            splitSize='sm'
          />
        </Box>
      </Paper>
      <EmailArrayFormComponent<FormData>
        emailArray={otherPresenters}
        arrayPath={of('otherPresenters')}
        errors={errors.otherPresenters}
        register={register}
        removePresenter={removePresenter}
        lockStatuses={lockStatuses}
      />
      <Button
        fullWidth
        onClick={() => {
          addPresenter({})
        }}
        variant='outlined'
        sx={{ mb: 1, ...displayLocked}}
      >
        Add Presenter
      </Button>
      <Paper>
        <StackedBoxes child_mx={1}>
          <FormField
            registerReturn={register('title', {
              required: 'Required'
            })}
            placeholder='Presentation Title'
            fullWidth
            sx={{ mt: 2 }}
            fieldError={errors.title}
            label='Title'
            hiddenLabel={!displayLabels}
            {...lockProps}
          />
          <FormField
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
            multiline
            rows={5}
            label='Abstract'
            hiddenLabel={!displayLabels}
            {...lockProps}
          />
          <FormField
            registerReturn={register('learningPoints', {
              required: 'Required',
              minLength: {
                value: 50,
                message: 'This field has a minimum length of 50 characters'
              }
            })}
            fieldError={errors.learningPoints}
            placeholder='What is the most important thing attendees would learn from your presentation?'
            fullWidth
            multiline
            rows={3}
            label='Learning Points'
            hiddenLabel={!displayLabels}
            {...lockProps}
          />
          <FormField
            registerReturn={register('presentationType')}
            fieldError={errors.presentationType}
            fullWidth
            select
            defaultValue={initialPresentationType}
            label='Presentation Type'
            hiddenLabel={!displayLabels}
            {...lockProps}
          >
            <MenuItem key='full length' value='full length'>
              Full Length Presentation (45 minutes)
            </MenuItem>
            <MenuItem key='7x7' value='7x7'>
              7x7 Presentation (7 minutes)
            </MenuItem>
          </FormField>

          {/* {timeWindowFields?.map((timeWindow, idx) => {
          return (
            <Box key={`timeWindow-${idx}`}>
                <p>Time window goes here</p>
                <TimeWindowPicker<FormDataType> register={register} path={of('')} />
                <Button
                variant='outlined'
                  onClick={() => {
                    removeTimeWindow(idx)
                  }}
                  >
                  Remove
                </Button>
                </Box>
                )
              })} */}
          {/* <Button
            variant='outlined'
            onClick={() => {
              addTimeWindow({})
            }}
            >
            Add Time Window{' '}
          </Button> */}
        </StackedBoxes>
      </Paper>
    </>
  )
}
