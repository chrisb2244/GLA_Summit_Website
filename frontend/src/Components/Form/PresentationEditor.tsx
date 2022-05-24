import {
  MySubmissionsModel,
  PresentationSubmissionsModel
} from '@/lib/databaseModels'
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

type PresentationEditorProps = {
  presentation: MySubmissionsModel
  submitter: PersonProps
}
import type { FormData } from './PresentationSubmissionFormCore'
import { EmailProps, PersonProps } from './Person'
import { StackedBoxes } from '../Layout/StackedBoxes'
import { supabase } from '@/lib/supabaseClient'
import { myLog } from '@/lib/utils'

export const PresentationEditor: React.FC<PresentationEditorProps> = ({
  presentation,
  submitter
}) => {
  const [expanded, setExpanded] = useState(false)
  const handleExpandClick = () => setExpanded(!expanded)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const deleteDraft = async () => {
    setIsSubmitting(true)
    const { error } = await supabase
      .from<PresentationSubmissionsModel>('presentation_submissions')
      .delete()
      .eq('id', presentation.presentation_id)
    if (error) {
      myLog({ error })
    }
    // Handle the mutation to remove this component
    setIsSubmitting(false)
  }

  const saveDraft = () => {
    console.log('Saving draft')
    setIsSubmitting(true)
    setTimeout(() => setIsSubmitting(false), 1000)
  }

  const submitPresentation = () => {
    setShowConfirmation(true)
  }

  const confirmationPopup = (
    <ConfirmationPopup
      open={showConfirmation}
      setClosed={() => setShowConfirmation(false)}
      onResolve={(confirmed) => {
        if (confirmed) {
          console.log('You submitted the presentation')
          setShowConfirmation(false)
          setIsSubmitting(true)
          setTimeout(() => setIsSubmitting(false), 1000)
        } else {
          console.log('Cancelled')
          setShowConfirmation(false)
        }
      }}
    />
  )

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

  const defaultFormCoreProps: Partial<
    PresentationSubmissionsModel & { otherPresenters: EmailProps[] }
  > = {
    id: presentation.presentation_id,
    abstract: presentation.abstract,
    is_submitted: presentation.is_submitted,
    learning_points: presentation.learning_points,
    presentation_type: presentation.presentation_type,
    title: presentation.title,
    otherPresenters: presentation.all_emails
      .filter((e) => e !== submitter.email)
      .map((e) => {
        return { email: e }
      })
  }

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
              <StackedBoxes>
                <PresentationSubmissionFormCore
                  register={register}
                  errors={errors}
                  otherPresenters={otherPresenterFields}
                  addPresenter={addPresenter}
                  removePresenter={removePresenter}
                  defaultValues={defaultFormCoreProps}
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
                    onClick={saveDraft}
                  >
                    {isSubmitting ? 'Saving draft...' : 'Save Draft'}
                  </Button>
                  <Button
                    variant='contained'
                    disabled={isSubmitting}
                    sx={{ flexGrow: 1 }}
                    onClick={submitPresentation}
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
