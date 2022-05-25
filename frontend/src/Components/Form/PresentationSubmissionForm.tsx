import {
  Button,
  Typography,
  Box,
  Paper,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import { useForm, of, useFieldArray } from 'react-hook-form'
import { Person } from '@/Components/Form/Person'
import type { EmailProps, PersonProps } from '@/Components/Form/Person'
import { StackedBoxes } from '../Layout/StackedBoxes'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { PresentationType } from '@/lib/databaseModels'
import { supabase } from '@/lib/supabaseClient'
import { ConfirmationPopup } from './ConfirmationPopup'
import { myLog } from '@/lib/utils'
import { PresentationSubmissionFormCore } from './PresentationSubmissionFormCore'

type FormProps = {
  submitter: PersonProps
}

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

export const PresentationSubmissionForm: React.FC<FormProps> = ({
  submitter
}) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
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
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])
  const router = useRouter()

  const isFinal = watch('isFinal')

  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formData, setSubmittedFormData] = useState<FormData | null>(null)

  const submitFormData = async (passedData?: FormData) => {
    setIsSubmitting(true)
    myLog('Submitting form data')
    const data = passedData ?? formData
    myLog({ data })

    fetch('/api/handlePresentationSubmission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        formdata: data,
        submitterId: supabase.auth.user()?.id
      })
    })
      .then(() => {
        router.push('/my-presentations')
      })
      .finally(() => {
        if (isMounted) setIsSubmitting(false)
      })
  }

  const handleConfirmation = (result: boolean) => {
    setShowConfirmation(false)
    if (result) {
      myLog('Confirmed form submission - submitting form')
      myLog({ formData })

      submitFormData()
    } else {
      myLog('Cancelled form submission')
    }
  }
  const confirmationPopup = (
    <ConfirmationPopup
      open={showConfirmation}
      setClosed={() => setShowConfirmation(false)}
      onResolve={handleConfirmation}
    />
  )

  return (
    <>
      <form
        onSubmit={handleSubmit(async (data) => {
          setSubmittedFormData(data)
          if (data.isFinal) {
            // This uses a callback to handleConfirmation, which submits the form data (or doesn't)
            setShowConfirmation(true)
          } else {
            submitFormData(data)
          }
        })}
      >
        <StackedBoxes stackSpacing={1.5} child_mx={{ xs: 1, sm: 2, md: 3 }}>
          <Typography variant='body1'>
            Please enter the information below and submit your presentation!
          </Typography>
          <Typography variant='body1'>
            Any additional presenters that you add here will be emailed inviting
            them to create an account, if they don&apos;t have one already, and
            to join this presentation. Only you, the presentation submitter,
            will be able to edit the presentation.
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
          <PresentationSubmissionFormCore
            register={register}
            errors={errors}
            otherPresenters={otherPresenterFields}
            addPresenter={addPresenter}
            removePresenter={removePresenter}
          />
          <FormControlLabel
            control={<Checkbox {...register('isFinal')} />}
            label='I am ready to submit this presentation (leave unchecked to save a draft)'
          />
          <Button
            variant='contained'
            type='submit'
            fullWidth
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isFinal
                ? 'Submitting now!'
                : 'Saving now!'
              : isFinal
              ? 'Submit Presentation'
              : 'Save Draft'}
          </Button>
        </StackedBoxes>
      </form>
      {confirmationPopup}
    </>
  )
}
