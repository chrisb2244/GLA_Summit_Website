import { MySubmissionsModel } from '@/lib/databaseModels'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
  IconButtonProps
} from '@mui/material'
import { useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { ConfirmationPopup } from './ConfirmationPopup'
import { PresentationSubmissionFormCore } from './PresentationSubmissionFormCore'
import { useFieldArray, useForm } from 'react-hook-form'
import type { FormData } from './PresentationSubmissionFormCore'
import { PersonProps } from './Person'
import { StackedBoxes } from '../Layout/StackedBoxes'

type PresentationEditorProps = {
  presentation: MySubmissionsModel
  submitter: PersonProps
  deleteCallback: () => Promise<void>
  updateCallback: (formData: FormData) => Promise<void>
}

export const PresentationEditor: React.FC<PresentationEditorProps> = ({
  presentation,
  submitter,
  updateCallback,
  deleteCallback
}) => {
  const [expanded, setExpanded] = useState(false)
  const handleExpandClick = () => setExpanded(!expanded)
  const [submittedData, setShowConfirmation] = useState<FormData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const deleteDraft = async () => {
    // Consider a confirmation dialog?
    await deleteCallback()
  }

  const saveDraft = (formData: FormData) => {
    setIsSubmitting(true)
    updateCallback(formData).then(() => setIsSubmitting(false))
  }

  const submitPresentation = (formData: FormData) => {
    // Submission is handled via callback from the ConfirmationPopup
    const fDataFinal = { ...formData, isFinal: true }
    setShowConfirmation(fDataFinal)
  }

  const confirmationPopup = (
    <ConfirmationPopup
      open={submittedData !== null}
      setClosed={() => setShowConfirmation(null)}
      onResolve={(confirmed) => {
        if (confirmed) {
          const formData = submittedData
          if (formData != null) {
            setShowConfirmation(null)
            setIsSubmitting(true)
            updateCallback(formData).then(() => setIsSubmitting(false))
          }
        } else {
          setShowConfirmation(null)
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
        <CardHeader
          title={presentation.title}
          action={
            <ExpandMore
              expand={expanded}
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label='show more'
            >
              <ExpandMoreIcon />
            </ExpandMore>
          }
        />
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
                />
                <Box
                  flexDirection={{ xs: 'column', md: 'row' }}
                  display='flex'
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

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean
}

const ExpandMore: React.FC<ExpandMoreProps> = ({ expand, ...other }) => {
  return (
    <IconButton
      {...other}
      sx={{
        transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
        marginLeft: 'auto'
      }}
    />
  )
}
