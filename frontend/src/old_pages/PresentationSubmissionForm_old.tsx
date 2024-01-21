import { Button, Typography, Checkbox, FormControlLabel } from '@mui/material';
import { useForm, useFieldArray } from 'react-hook-form';
import { StackedBoxes } from '@/Components/Layout/StackedBoxes';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { PresentationType } from '@/lib/databaseModels';
// import { PresentationSubmissionConfirmationPopup } from '@/Components/Form/PresentationSubmissionConfirmationPopup';
import type { EmailProps, PersonProps } from '@/Components/Form/Person';
import { myLog } from '@/lib/utils';
import { PresentationSubmissionFormCore } from './PresentationSubmissionFormCore';
// import { useSession } from '@/lib/sessionContext';

type FormProps = {
  submitter: PersonProps;
};

export type FormData = {
  submitter: PersonProps;
  otherPresenters: EmailProps[];
  title: string;
  abstract: string;
  learningPoints: string;
  presentationType: PresentationType;
  timeWindows: { windowStartTime: Date; windowEndTime: Date }[];
  isFinal: boolean;
};

export const PresentationSubmissionForm: React.FC<
  React.PropsWithChildren<FormProps>
> = ({ submitter }) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormData>({ mode: 'onTouched' });

  const {
    fields: otherPresenterFields,
    append: addPresenter,
    remove: removePresenter
  } = useFieldArray<FormData, 'otherPresenters'>({
    name: 'otherPresenters',
    control
  });

  // const {
  //   fields: timeWindowFields,
  //   append: addTimeWindow,
  //   remove: removeTimeWindow
  // } = useFieldArray<FormDataType, 'timeWindows'>({
  //   name: 'timeWindows',
  //   control
  // })

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user } = { user: null } as { user: { id: string } | null }; // useSession();
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  const router = useRouter();

  const isFinal = watch('isFinal');

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setSubmittedFormData] = useState<FormData | null>(null);

  const submitFormData = async (passedData?: FormData) => {
    setIsSubmitting(true);
    myLog('Submitting form data');
    const data = passedData ?? formData;
    if (data == null) {
      setIsSubmitting(false);
      return;
    }
    myLog({ data });

    fetch('/api/handlePresentationSubmission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        formdata: data,
        submitterId: user?.id
      })
    })
      .then(() => {
        router.push('/my-presentations');
      })
      .finally(() => {
        if (isMounted) setIsSubmitting(false);
      });
  };

  const handleConfirmation = (result: boolean) => {
    if (result) {
      myLog('Confirmed form submission - submitting form');
      myLog({ formData });

      submitFormData();
    } else {
      myLog('Cancelled form submission');
    }
  };
  // const confirmationPopup = (
  //   <PresentationSubmissionConfirmationPopup
  //     open={showConfirmation}
  //     setClosed={() => setShowConfirmation(false)}
  //     onResolve={handleConfirmation}
  //   />
  // );

  return (
    <>
      <form
        onSubmit={handleSubmit(async (data) => {
          setSubmittedFormData(data);
          if (data.isFinal) {
            // This uses a callback to handleConfirmation, which submits the form data (or doesn't)
            setShowConfirmation(true);
          } else {
            submitFormData(data);
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
          <PresentationSubmissionFormCore
            submitter={submitter}
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
      {/* {confirmationPopup} */}
    </>
  );
};
