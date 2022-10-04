import { useSession } from '@/lib/sessionContext'
import { useEffect, useState } from 'react'
import { PresentationSubmissionForm } from '@/Components/Forms/PresentationSubmissionForm'
import type { PersonProps } from '@/Components/Form/Person'
import { RegistrationPopup } from '@/Components/SigninRegistration/RegistrationPopup'

const PresentationSubmissionFormPage = (): JSX.Element => {
  const [submitter, setSubmitter] = useState<PersonProps | null>(null)
  const { profile, user } = useSession()

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
          signIn={() => Promise.reject()}
          signUp={() => Promise.reject()}
          initialState='signup'
        />
      </>
    )
  }

  // Add question re presentation timezones

  return (
    <>
      <PresentationSubmissionForm submitter={submitter} />
    </>
  )
}

export default PresentationSubmissionFormPage
