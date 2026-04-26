import {
  PopupProps,
  ConfirmationPopup
} from '@/Components/Utilities/ConfirmationPopup';

const P = ({ children }: React.PropsWithChildren<unknown>) => {
  return <p className='prose pb-4 text-justify'>{children}</p>;
};

export const PresentationSubmissionConfirmationPopup: React.FC<PopupProps> = (
  props
) => {
  return (
    <ConfirmationPopup {...props}>
      <P>
        If you submit this presentation, then it will be locked and you will be
        unable to continue to edit it.
      </P>
      <P>
        Additionally, if your presentation is accepted then the public-intended
        components (name, bio, and image) of your (and your co-presenters&apos;)
        profiles will be made public and placed alongside your accepted
        presentation.
      </P>
      <P>Please confirm that you accept this.</P>
    </ConfirmationPopup>
  );
};
