import { PopupProps, ConfirmationPopup } from '@/Components/ConfirmationPopup'
import { ReactNode } from 'react'

export const PresentationSubmissionConfirmationPopup: React.FC<PopupProps> = (props) => {
  const P: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
    return (
      <p className='prose pb-4 text-justify'>
        {props.children}
      </p>
    )
  }

  return (
    <ConfirmationPopup {...props}>
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
