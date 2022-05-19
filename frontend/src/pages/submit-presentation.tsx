import { useSession } from '@/lib/sessionContext'
import { useEffect, useState } from 'react'
import { PresentationSubmissionForm } from '@/Components/Form/PresentationSubmissionForm'
import type { PersonProps } from '@/Components/Form/Person'

const PresentationSubmissionFormPage = (): JSX.Element => {
  const [submitter, setSubmitter] = useState<PersonProps | null>(null)
  const { session, profile } = useSession()

  useEffect(() => {
    if (
      typeof session?.user !== 'undefined' &&
      session?.user !== null &&
      profile !== null
    ) {
      const email = session.user.email ?? ''
      const { firstname, lastname } = profile
      const v = {
        firstName: firstname,
        lastName: lastname,
        email: email
      }
      setSubmitter(v)
    }
  }, [session, profile])

  if (submitter === null) {
    // Not signed in
    return <p>You need to be signed in to use this page...</p>
  }

  // Readd "What is the most important thing attendees will learn from your presentation"
  // Add question re presentation timezones

  return (
    <>
      <PresentationSubmissionForm submitter={submitter} />
    </>
  )
}

export default PresentationSubmissionFormPage
