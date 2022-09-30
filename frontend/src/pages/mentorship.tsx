import { MentoringForm, RegistrationData, RegistrationType } from '@/Components/Forms/MentoringForm'
import { useSession } from '@/lib/sessionContext'
import { useEffect, useState } from 'react'
import type { NextPage } from 'next'
import type { PersonProps } from '@/Components/Form/Person'

const MentorshipPage: NextPage = () => {
  const { user, profile } = useSession()
  const [defaultPerson, setDefaultPerson] = useState<PersonProps | undefined>(
    undefined
  )

  useEffect(() => {
    if (user !== null && profile !== null) {
      const newPerson = {
        firstName: profile?.firstname ?? '',
        lastName: profile?.lastname ?? '',
        email: user?.email ?? ''
      }
      setDefaultPerson(newPerson)
    }
  }, [profile, user])

  const existingRegistrationType: RegistrationType | null = null

  const registrationFn = async (data: RegistrationData) => {
    console.log(data)
  }

  return (
    <MentoringForm
      defaultEntry={defaultPerson}
      registered={existingRegistrationType}
      registrationFn={registrationFn}
    />
  )
}

export default MentorshipPage
