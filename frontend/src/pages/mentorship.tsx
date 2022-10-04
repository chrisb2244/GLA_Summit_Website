import { MentoringForm, RegistrationData, RegistrationType } from '@/Components/Forms/MentoringForm'
import { useSession } from '@/lib/sessionContext'
import { useEffect, useState } from 'react'
import type { NextPage } from 'next'
import type { PersonProps } from '@/Components/Form/Person'
import { supabase } from '@/lib/supabaseClient'
import { myLog } from '@/lib/utils'
import { RegistrationPopup } from '@/Components/SigninRegistration/RegistrationPopup'

const MentorshipPage: NextPage = () => {
  const { user, profile, signIn, signUp } = useSession()
  const [defaultPerson, setDefaultPerson] = useState<PersonProps | undefined>(
    undefined
  )
  const [existingRegistrationType, setRegistrationStatus] = useState<RegistrationType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateRegStatus = async (email: string | undefined) => {
      if (typeof email === 'undefined') {
        setLoading(false)
        return
      }
      const { data, error } = await supabase.from('mentoring').select('entry_type').eq('email', email)
      if (error) {
        setLoading(false)
        throw error
      }
      if(typeof data != 'undefined' && data.length === 1) {
        setRegistrationStatus(data[0].entry_type)
      }
      setLoading(false)
    }
    if (user !== null && profile !== null) {
      setLoading(true)
      const newPerson = {
        firstName: profile?.firstname ?? '',
        lastName: profile?.lastname ?? '',
        email: user?.email ?? ''
      }
      setDefaultPerson(newPerson)
    }
    updateRegStatus(user?.email)
  }, [profile, user])

  const registrationFn = async (data: RegistrationData) => {
    const { firstName, lastName, email } = data.person
    const { error} = await supabase.from('mentoring').insert({
      entry_type: data.type,
      firstname: firstName,
      lastname: lastName,
      email
    })
    if (error) {
      myLog(error)
    }
    
  }

  const [open, setOpenState] = useState(!user)

  return (
    <>
      {!loading && user && (
        <MentoringForm
          defaultEntry={defaultPerson}
          registered={existingRegistrationType}
          registrationFn={registrationFn}
        />
      )}
      {!user &&
        (
          <>
            <p>You need to be signed in to use this page.</p>
            <RegistrationPopup open={open} setClosed={() => setOpenState(false)} signIn={signIn} signUp={signUp} />
          </>
        )
      }
    </>
  )
}

export default MentorshipPage
