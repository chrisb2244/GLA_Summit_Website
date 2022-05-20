import { Button, Typography, Box, Paper } from '@mui/material'
import { useForm, of, useFieldArray } from 'react-hook-form'
import { Person } from '@/Components/Form/Person'
import type { PersonProps } from '@/Components/Form/Person'
import { StackedBoxes } from '../Layout/StackedBoxes'
import { PersonArrayFormComponent } from './PersonArray'
import { FormField } from './FormField'
import { useState } from 'react'
import { useRouter } from 'next/router'

type FormProps = {
  submitter: PersonProps
}

export type FormData = {
  submitter: PersonProps
  otherPresenters: PersonProps[]
  title: string
  abstract: string
  learningPoints: string
  timeWindows: { windowStartTime: Date; windowEndTime: Date }[]
}

export const PresentationSubmissionForm: React.FC<FormProps> = ({
  submitter
}) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({ mode: 'onTouched' })

  const {
    fields: otherPresenterFields,
    append: addPresenter,
    remove: removePresenter
  } = useFieldArray<FormData, 'otherPresenters'>({
    name: 'otherPresenters',
    control
  })

  // const {
  //   fields: timeWindowFields,
  //   append: addTimeWindow,
  //   remove: removeTimeWindow
  // } = useFieldArray<FormDataType, 'timeWindows'>({
  //   name: 'timeWindows',
  //   control
  // })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  // const abstract = useWatch({
  //   control,
  //   name: 'abstract',
  // })
  // const minLengthMessageAbstract = `This field has a minimum length of 100 characters (${abstract?.length ?? 0}/100)`

  return (
    <form onSubmit={handleSubmit((data) => {
      setIsSubmitting(true)
      fetch('/api/handlePresentationSubmission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ formdata: data })
      }).then(() => {
        router.push('/')
        setIsSubmitting(false)
      })
    })}>
      <StackedBoxes stackSpacing={1.5}>
        <Typography variant='body1'>
          Please enter the information below and submit your presentation!
        </Typography>
        <Paper>
          <Box px={1} py={2}>
            <Person<FormData>
              heading='Submitter'
              defaultValue={submitter}
              errors={errors.submitter}
              register={register}
              path={of('submitter')}
              locked
              splitSize='sm'
            />
          </Box>
        </Paper>
        <PersonArrayFormComponent<FormData>
          personArray={otherPresenterFields}
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
        >
          Add Presenter
        </Button>
        <Paper>
          <StackedBoxes>
            <FormField
              registerReturn={register('title', {
                required: 'Required'
              })}
              placeholder='Presentation Title'
              fullWidth
              sx={{ pt: 2 }}
              fieldError={errors.title}
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
                // onChange: (ev) => {
                //   setAbstractLength(ev.target.value.length)
                // }
              })}
              fieldError={errors.abstract}
              placeholder='Presentation Abstract'
              fullWidth
              multiline
              rows={5}
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
            />
          </StackedBoxes>
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
        </Paper>
        <Button variant='contained' type='submit' fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Submitting now!' : 'Submit Presentation' }
        </Button>
      </StackedBoxes>
    </form>
  )
}
