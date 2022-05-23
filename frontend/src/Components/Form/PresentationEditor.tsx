import { PresentationSubmissionsModel } from '@/lib/databaseModels'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
  IconButtonProps,
  Typography
} from '@mui/material'
import { useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { ConfirmationPopup } from './ConfirmationPopup'

type PresentationEditorProps = {
  presentation: PresentationSubmissionsModel
}

export const PresentationEditor: React.FC<PresentationEditorProps> = ({
  presentation
}) => {
  const [expanded, setExpanded] = useState(false)
  const handleExpandClick = () => setExpanded(!expanded)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
            <Typography>Abstract: {presentation.abstract}</Typography>
            <Box
              flexDirection={{ xs: 'column', md: 'row' }}
              display='flex'
              gap={1}
              pt={2}
            >
              <Button variant='outlined' disabled={isSubmitting} sx={{flexGrow: 1}} onClick={saveDraft}>
                {isSubmitting ? 'Saving draft...' : 'Save Draft'}
              </Button>
              <Button variant='contained' disabled={isSubmitting} sx={{flexGrow: 1}} onClick={submitPresentation}>
                {isSubmitting ? 'Submitting now...' : 'Submit Presentation'}
              </Button>
            </Box>
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
