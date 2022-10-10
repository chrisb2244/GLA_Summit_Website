import { MentoringForm, RegistrationData, RegistrationType } from '@/Components/Forms/MentoringForm'
import { useSession } from '@/lib/sessionContext'
import { useEffect, useState } from 'react'
import type { NextPage } from 'next'
import type { PersonProps } from '@/Components/Form/Person'
import { supabase } from '@/lib/supabaseClient'
import { myLog } from '@/lib/utils'
import { RegistrationPopup } from '@/Components/SigninRegistration/RegistrationPopup'
import { Box, List, ListItem, ListItemIcon, Typography, TypographyProps } from '@mui/material'
import RightArrowIcon from '@mui/icons-material/ArrowRight'

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

  const P: React.FC<TypographyProps> = ({children, ...rest}) => {
    return <Typography {...rest}>{children}</Typography>
  }

  return (
    <>
      <Typography variant='h3' textAlign='center'>GLA Summit 2022 Mentorship Scheme</Typography>
      <Box width={{xs:'90%', sm: '60%'}} mx='auto'>
      <P py={1}>
        <P fontStyle='italic' textAlign='center'>
          &ldquo;memorable events are built around ideas, not individuals&rdquo;
        </P>
        and so that&apos;s why this year we&apos;re inviting community leaders to
        mentor new presenters, by helping them develop their ideas and
        present them at the GLA Summit 2022.
      </P>

      <P py={1}>
        This initiative is about encouraging those have something to say,
        but don&apos;t necessarily feel confident presenting in front of
        the LabVIEW and TestStand Community [just yet].
      </P>

      <Box py={1}>
      <P>
        The commitment could vary but we estimate just a few hours will be
        needed to review a presenter&apos;s presentation and give feedback.
        We recommend the following meetings between pairings:
      </P>
      <List>
        <ListItem sx={{py: 0}}>
          <ListItemIcon><RightArrowIcon /></ListItemIcon>
          <Typography>
              An initial meeting with the mentee discuss initial ideas.
              The mentor can suggest what does and doesn&apos;t works 
              well with audiences.
          </Typography>
        </ListItem>
        <ListItem sx={{py: 0}}>
          <ListItemIcon><RightArrowIcon /></ListItemIcon>
          <Typography>
            A presentation review session where final feedback can be given.
          </Typography>
        </ListItem>
      </List>
      </Box>

      <P>
        If you&apos;re up for mentoring a new wave of speakers, let us know
        by filling out the form below with the &ldquo;I&apos;d like to be a mentor!&rdquo;
        element selected
      </P>

      <P>
        Equally, if you&apos;d like guidance on your presentation, select the
        &ldquo;I&apos;d like to receive mentorship&rdquo; form and click submit!
      </P>

      {!user &&
        (
          <>
            <p>You need to be signed in to use this page.</p>
            <RegistrationPopup open={open} setClosed={() => setOpenState(false)} signIn={signIn} signUp={signUp} initialState='signin'/>
          </>
        )
      }
      </Box>

      {!loading && user && (
        <Box pb={2}>
          <MentoringForm
            defaultEntry={defaultPerson}
            registered={existingRegistrationType}
            registrationFn={registrationFn}
          />
        </Box>
      )}
    </>
  )
}

export default MentorshipPage
