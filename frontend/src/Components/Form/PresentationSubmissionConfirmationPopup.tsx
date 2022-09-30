import { Typography } from '@mui/material'
import { PopupProps, ConfirmationPopup } from '@/Components/ConfirmationPopup'

export const PresentationSubmissionConfirmationPopup: React.FC<PopupProps> = ({children: unusedChildren , ...other}) => {
  const P: React.FC = ({ children }) => {
    return (
      <Typography align='justify' pb={2}>
        {children}
      </Typography>
    )
  }

  return (
    <ConfirmationPopup {...other}>
      <P>
        If you submit this presentation, then it will be locked and you will
        be unable to continue to edit it.
      </P>
      <P>
        Additionally, if your presentation is accepted then the
        public-intended components (name, bio, and image) of your (and your
        co-presenters&apos;) profiles will be made public and placed alongside
        your accepted presentation.
      </P>
      <P>Please confirm that you accept this.</P>
    </ConfirmationPopup>
  )
}
