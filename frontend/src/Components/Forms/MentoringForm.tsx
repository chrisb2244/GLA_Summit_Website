import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';

import { Person, type PersonProps } from '@/Components/Form/Person';
import { Button } from '../Form/Button';

type FormProps = {
  // No longer allow anonymous usage - the user must be signed in.
  account: PersonProps;
  registered?: RegistrationType | null;
  registrationFn: (data: RegistrationData) => void;
};

type FormData = {
  person: PersonProps;
};

export type RegistrationType = 'mentor' | 'mentee';
export type RegistrationData = {
  person: PersonProps;
  type: RegistrationType;
};

export const MentoringForm: React.FC<React.PropsWithChildren<FormProps>> = ({
  account,
  registered,
  registrationFn
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<FormData>({ mode: 'onTouched' });

  useEffect(() => {
    setValue('person', account, {
      shouldTouch: true,
      shouldDirty: true
    });
  }, [account, setValue]);

  const entryTypes = [
    {
      entryType: 'mentor',
      tabLabel: "I'd like to be a mentor!",
      confirmationResponse: 'Thank you for offering to be a mentor',
      registeredMessage: 'Thank you - you are already registered to be a mentor'
    },
    {
      entryType: 'mentee',
      tabLabel: "I'd like to receive mentorship",
      confirmationResponse:
        'Thank you for your interest! We will be in touch soon!',
      registeredMessage:
        'Thank you - we already received your registration of interest for mentoring'
    }
  ] as const;

  const [tabIndex /* setTabIndex */] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const confirmationResponse = (
    <div>
      <p>{entryTypes[tabIndex].confirmationResponse}</p>
    </div>
  );

  // const handleChange = (event: React.SyntheticEvent, newIndex: number) => {
  //   setTabIndex(newIndex);
  // };

  if (registered !== null) {
    const msg = entryTypes.filter((eType) => eType.entryType === registered)[0]
      .registeredMessage;
    return (
      <div>
        <p>{msg}</p>
      </div>
    );
  } else {
    return (
      <>
        {!showConfirmation && (
          <div>
            {/* <Tabs
              value={tabIndex}
              onChange={handleChange}
              sx={{ pb: 2 }}
              variant='fullWidth'
            >
              {entryTypes.map((eType) => {
                return <Tab label={eType.tabLabel} key={eType.entryType} />;
              })}
            </Tabs> */}
            <form
              onSubmit={handleSubmit(async (data) => {
                registrationFn({
                  person: data.person,
                  type: entryTypes[tabIndex].entryType
                });
                setShowConfirmation(true);
              })}
            >
              <Person<FormData>
                register={register}
                path={'person'}
                errors={errors.person}
                defaultValue={account}
                locked
              />
              <Button type='submit' fullWidth>
                Submit
              </Button>
            </form>
          </div>
        )}
        {showConfirmation && confirmationResponse}
      </>
    );
  }
};
