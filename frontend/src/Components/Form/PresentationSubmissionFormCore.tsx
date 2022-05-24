import {
  Button,
  Typography,
  Box,
  Paper,
  MenuItem,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import {
  of,
  UseFormRegister,
  UseFieldArrayAppend,
  FieldErrors,
  UseFieldArrayRemove
} from 'react-hook-form'
import { Person } from '@/Components/Form/Person'
import type { EmailProps, PersonProps } from '@/Components/Form/Person'
import { StackedBoxes } from '../Layout/StackedBoxes'
import { EmailArrayFormComponent } from './EmailArray'
import { FormField } from './FormField'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { PresentationSubmissionsModel, PresentationType } from '@/lib/databaseModels'
import { supabase } from '@/lib/supabaseClient'
import { ConfirmationPopup } from './ConfirmationPopup'
import { myLog } from '@/lib/utils'

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

type PresentationFormCoreProps = {
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
  addPresenter: UseFieldArrayAppend<FormData, 'otherPresenters'>
  otherPresenters: EmailProps[]
  removePresenter: UseFieldArrayRemove
  defaultValues?: Partial<PresentationSubmissionsModel & {otherPresenters: EmailProps[]}>
  displayLabels?: boolean
}

export const PresentationSubmissionFormCore: React.FC<
  PresentationFormCoreProps
> = ({
  register,
  errors,
  addPresenter,
  removePresenter,
  defaultValues,
  displayLabels = false
}) => {
  const op = defaultValues?.otherPresenters
  return (
    <>
      <EmailArrayFormComponent<FormData>
        emailArray={op ?? []}
        arrayPath={of('otherPresenters')}
        errors={errors.otherPresenters}
        register={register}
        removePresenter={removePresenter}
      />
      <Button
        fullWidth
        onClick={() => {
          addPresenter({})
        }}
        variant='outlined'
        sx={{ mb: 1 }}
      >
        Add Presenter
      </Button>
      <Paper>
        <StackedBoxes child_mx={{ xs: 1, md: 3 }}>
          <FormField
            registerReturn={register('title', {
              required: 'Required'
            })}
            placeholder='Presentation Title'
            fullWidth
            sx={{ mt: 2 }}
            fieldError={errors.title}
            defaultValue={defaultValues?.title}
            label='Title'
            hiddenLabel={!displayLabels}
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
            defaultValue={defaultValues?.abstract}
            label='Abstract'
            hiddenLabel={!displayLabels}
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
            rows={2}
            defaultValue={defaultValues?.learning_points}
            label='Learning Points'
            hiddenLabel={!displayLabels}
          />
          <FormField
            registerReturn={register('presentationType')}
            fieldError={errors.presentationType}
            fullWidth
            select
            defaultValue={defaultValues?.presentation_type ?? 'full length'}
            label='Presentation Type'
            hiddenLabel={!displayLabels}
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
