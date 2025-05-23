import type { FormData } from '@/Components/Forms/PresentationSubmissionForm_old';
import { FormSubmissionEmail } from '@/EmailTemplates/FormSubmissionEmail';
import { buildSubmitterName, P } from '@/EmailTemplates/emailComponents';
import { PersonProps } from '@/Components/Form/Person';
import {
  adminAddNewPresentationSubmission,
  adminUpdateExistingPresentationSubmission
} from '../lib/databaseFunctions';
import { submissionsForYear } from '../lib/databaseModels';

export const uploadPresentationData = async (
  formData: FormData,
  submitterId: string,
  presentationId?: string
) => {
  const content = {
    submitter_id: submitterId,
    is_submitted: formData.isFinal,
    title: formData.title,
    abstract: formData.abstract,
    learning_points: formData.learningPoints,
    presentation_type: formData.presentationType,
    year: submissionsForYear
  };
  if (typeof presentationId === 'undefined') {
    return adminAddNewPresentationSubmission(content);
  } else {
    return adminUpdateExistingPresentationSubmission({
      ...content,
      id: presentationId
    });
  }
};

export const EmailToSubmitter: React.FC<{ data: FormData }> = ({ data }) => {
  const isSubmitted = data.isFinal;

  const introText = isSubmitted ? (
    <P sx={{ textAlign: 'justify' }}>
      Thank you for submitting a presentation for GLA Summit 2022!
    </P>
  ) : (
    <P sx={{ textAlign: 'justify' }}>
      We&apos;ve stored your draft presentation for GLA Summit 2022!
      <br />
      Please feel free to edit it as you need until you&apos;re ready to submit
      it via the &quot;My Presentations&quot; page.
    </P>
  );
  const headerText = (
    <>
      {introText}
      <P>The data you submitted is shown below.</P>
    </>
  );
  return <FormSubmissionEmail data={data} headerText={headerText} />;
};

export const EmailToExistingOtherPresenter: React.FC<{
  data: FormData;
  receiver: PersonProps;
}> = ({ data, receiver }) => {
  const submitterName = buildSubmitterName(data);
  const recipFName = receiver.firstName;
  const recipLName = receiver.lastName;
  const recipientName =
    typeof recipFName === 'undefined' && typeof recipLName === 'undefined'
      ? receiver.email
      : [recipFName, recipLName].join(' ');

  const headerText = (
    <>
      <P>{`Dear ${recipientName},`}</P>
      <P>{`You have been added as a co-presenter by ${submitterName} to the presentation shown below.`}</P>
      <P>
        You will now be able to see this submission (and any changes made over
        time) in your &apos;My Presentations&apos; page whilst logged in to
        https://glasummit.org
      </P>
    </>
  );

  return <FormSubmissionEmail data={data} headerText={headerText} />;
};

export const EmailToNewOtherPresenter: React.FC<{
  data: FormData;
  email: string;
}> = ({ data, email }) => {
  const submitterName = buildSubmitterName(data);

  const headerText = (
    <>
      <P>{`Dear ${email},`}</P>
      <P>
        {'You have been added as a co-presenter for GLA 2022 by ' +
          submitterName +
          ' to the presentation shown below.'}
      </P>
      <P>
        You will now be able to see this submission (and any changes made over
        time) in your &apos;My Presentations&apos; page whilst logged in to
        https://glasummit.org
      </P>
      <P>
        An account for this email address has been automatically created, but no
        profile data has been generated. Please use the login rather than
        registration form at https://glasummit.org and then use the &apos;My
        Profile&apos; page to set your name, and if you wish, a short
        description and/or image.
      </P>
      <P>
        If you believe that this email was sent to you by mistake (if you did
        not expect to be listed as a co-presenter on this presentation) then
        please contact web@glasummit.org or reply to this email and we will
        remove you (and optionally your created account).
      </P>
    </>
  );

  return <FormSubmissionEmail data={data} headerText={headerText} />;
};
