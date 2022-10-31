import { MySubmissionsModel } from '@/lib/databaseModels'
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Collapse
} from '@mui/material'
import { useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useFieldArray, useForm } from 'react-hook-form'
import { PresentationSubmissionConfirmationPopup } from '@/Components/Form'
import type { PersonProps } from '@/Components/Form'
import { isLocked, PresentationLockedStatus, PresentationSubmissionFormCore } from './PresentationSubmissionFormCore'
import type { FormData } from './PresentationSubmissionFormCore'
import { StackedBoxes } from '@/Components/Layout/StackedBoxes'

type PresentationEditorProps = {
  presentation: MySubmissionsModel
  submitter: PersonProps
  lockStatuses?: PresentationLockedStatus
  deleteCallback: () => Promise<void>
  updateCallback: (formData: FormData) => Promise<void>
}

export const PresentationEditor: React.FC<React.PropsWithChildren<PresentationEditorProps>> = ({
  presentation,
  submitter,
  lockStatuses = {isCopresenter: false, isSubmitted: false},
  updateCallback,
  deleteCallback
}) => {
  const [expanded, setExpanded] = useState(false)
  const handleExpandClick = () => setExpanded(!expanded)
  const [submittedData, setShowConfirmation] = useState<FormData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const locked = isLocked(lockStatuses)

  const deleteDraft = async () => {
    // Consider a confirmation dialog?
    if (!locked) {
      await deleteCallback()
    }
  }

  const saveDraft = (formData: FormData) => {
    if (!locked) {
      setIsSubmitting(true)
      updateCallback(formData).then(() => setIsSubmitting(false))
    }
  }

  const submitPresentation = (formData: FormData) => {
    // Submission is handled via callback from the ConfirmationPopup
    if (!locked) {
      const fDataFinal = { ...formData, isFinal: true }
      setShowConfirmation(fDataFinal)
    }
  }

  const confirmationPopup = (
    <PresentationSubmissionConfirmationPopup
      open={submittedData !== null}
      setClosed={() => setShowConfirmation(null)}
      onResolve={(confirmed) => {
        if (confirmed) {
          const formData = submittedData
          if (formData != null) {
            setIsSubmitting(true)
            updateCallback(formData).then(() => setIsSubmitting(false))
          }
        }
      }}
    />
  )
  const otherPresenters = presentation.all_emails
    .filter((e) => e !== submitter.email)
    .map((e) => {
      return { email: e }
    })

  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    mode: 'onTouched',
    defaultValues: {
      submitter,
      otherPresenters,
      abstract: presentation.abstract,
      isFinal: presentation.is_submitted,
      learningPoints: presentation.learning_points,
      presentationType: presentation.presentation_type,
      title: presentation.title,
      timeWindows: []
    }
  })

  const {
    fields: otherPresenterFields,
    append: addPresenter,
    remove: removePresenter
  } = useFieldArray<FormData, 'otherPresenters'>({
    name: 'otherPresenters',
    control
  })

  return (
    <>
      <Card>
        <CardActionArea onClick={handleExpandClick} sx={{backgroundColor: lockStatuses.isSubmitted ? 'lightgrey' : undefined}}>
          <CardHeader
            sx={{'> .MuiCardHeader-action': {alignSelf: 'center'}}}
            title={[presentation.title, lockStatuses.isCopresenter ? '(Copresenter)' : ''].join(' ')}
            action={
              <ExpandMoreIcon
                aria-expanded={expanded}
                aria-label='show more'
                sx={{
                  transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
                  marginLeft: 'auto'
                }}
              />
            }
          />
        </CardActionArea>
        <Collapse in={expanded} timeout='auto' unmountOnExit>
          <CardContent>
            <form>
              <StackedBoxes child_mx={{ xs: 0, md: 3 }}>
                <PresentationSubmissionFormCore
                  register={register}
                  errors={errors}
                  submitter={submitter}
                  otherPresenters={otherPresenterFields}
                  addPresenter={addPresenter}
                  removePresenter={removePresenter}
                  initialPresentationType={presentation.presentation_type}
                  displayLabels
                  lockStatuses={lockStatuses}
                />
                <Box
                  flexDirection={{ xs: 'column', md: 'row' }}
                  display={locked ? 'none' : 'flex'}
                  gap={1}
                  pt={2}
                >
                  <Button
                    variant='outlined'
                    disabled={isSubmitting}
                    sx={{ flexGrow: 1 }}
                    onClick={deleteDraft}
                  >
                    {isSubmitting ? 'Deleting draft...' : 'Delete Draft'}
                  </Button>
                  <Button
                    variant='outlined'
                    disabled={isSubmitting}
                    sx={{ flexGrow: 1 }}
                    onClick={handleSubmit(saveDraft)}
                  >
                    {isSubmitting ? 'Saving draft...' : 'Save Draft'}
                  </Button>
                  <Button
                    variant='contained'
                    disabled={isSubmitting}
                    sx={{ flexGrow: 1 }}
                    onClick={handleSubmit(submitPresentation)}
                  >
                    {isSubmitting ? 'Submitting now...' : 'Submit Presentation'}
                  </Button>
                </Box>
              </StackedBoxes>
            </form>
          </CardContent>
        </Collapse>
      </Card>
      {confirmationPopup}
    </>
  )
}
