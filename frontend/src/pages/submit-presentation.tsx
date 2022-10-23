import { useSession } from '@/lib/sessionContext'
import { useEffect, useState } from 'react'
import { PresentationSubmissionForm } from '@/Components/Forms/PresentationSubmissionForm'
import type { PersonProps } from '@/Components/Form/Person'
import { RegistrationPopup } from '@/Components/SigninRegistration/RegistrationPopup'
import { Alert, Box, Typography } from '@mui/material'

const PresentationSubmissionFormPage = (): JSX.Element => {
  const [submitter, setSubmitter] = useState<PersonProps | null>(null)
  const { profile, user, signIn, signUp } = useSession()

  useEffect(() => {
    if (user !== null && profile !== null) {
      const email = user.email ?? ''
      const { firstname, lastname } = profile
      const v = {
        firstName: firstname ?? '',
        lastName: lastname ?? '',
        email: email
      }
      setSubmitter(v)
    }
  }, [user, profile])

  const [showSignupPopup, setShowSignupPopup] = useState(submitter === null)
  if (submitter === null) {
    // Not signed in
    return (
      <>
        <p>You need to be signed in to use this page...</p>
        <RegistrationPopup
          open={showSignupPopup}
          setClosed={() => setShowSignupPopup(false)}
          signIn={signIn}
          signUp={signUp}
          initialState='signup'
        />
      </>
    )
  }

  // Add question re presentation timezones

  return (
    <>
      <Alert
        severity='warning'
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box display='flex' flexDirection='column' alignContent='center'>
          <Typography textAlign='center' width='100%'>
            Our presentation submission process will close on Friday 28th
            October.
            <br />
            If you are considering submitting a presentation, please do so this
            week!
          </Typography>
        </Box>
      </Alert>
      <PresentationSubmissionForm submitter={submitter} />
    </>
  )
}

export default PresentationSubmissionFormPage
