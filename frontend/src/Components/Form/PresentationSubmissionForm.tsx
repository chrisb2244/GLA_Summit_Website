import { Button, TextField, Typography, Box, Paper } from '@mui/material'
import { useForm, of, useFieldArray } from 'react-hook-form'
import { Person } from '@/Components/Form/Person'
import type { PersonProps } from '@/Components/Form/Person'
import { StackedBoxes } from '../Layout/StackedBoxes'
import { PersonArrayFormComponent } from './PersonArray'

type FormProps = {
  submitter: PersonProps
}

type FormDataType = {
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
  } = useForm<FormDataType>()

  const {
    fields: otherPresenterFields,
    append: addPresenter,
    remove: removePresenter
  } = useFieldArray<FormDataType, 'otherPresenters'>({
    name: 'otherPresenters',
    control
  })

  const {
    fields: timeWindowFields,
    append: addTimeWindow,
    remove: removeTimeWindow
  } = useFieldArray<FormDataType, 'timeWindows'>({
    name: 'timeWindows',
    control
  })

  return (
    <Box onSubmit={handleSubmit((data) => console.log(data))}>
      <StackedBoxes stackSpacing={1.5}>
        <Typography variant='body1'>
          Please enter the information below and submit your presentation!
        </Typography>
        <Paper>
          <Box px={1} py={2}>
            <Person<FormDataType>
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
        <PersonArrayFormComponent<FormDataType>
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
            <TextField
              {...register('title', {
                required: true
              })}
              placeholder='Presentation Title'
              fullWidth
              sx={{ pt: 2 }}
            />
            <TextField
              {...register('abstract', {
                required: true,
                minLength: 100,
                maxLength: 5000
              })}
              placeholder='Presentation Abstract'
              fullWidth
              multiline
              rows={5}
            />
            <TextField
              {...register('learningPoints', {
                required: true,
                minLength: 50
              })}
              placeholder='What is the most important thing attendees would learn from your presentation?'
              fullWidth
              multiline
              rows={2}
            />
          </StackedBoxes>
          {timeWindowFields?.map((timeWindow, idx) => {
            return (
              <Box key={`timeWindow-${idx}`}>
                <p>Time window goes here</p>
                {/* <TimeWindowPicker<FormDataType> register={register} path={of('')} /> */}
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
          })}
          <Button
            variant='outlined'
            onClick={() => {
              addTimeWindow({})
            }}
          >
            Add Time Window{' '}
          </Button>
        </Paper>
        <Button variant='contained' type='submit' fullWidth>
          Submit Presentation
        </Button>
      </StackedBoxes>
    </Box>
  )
}
