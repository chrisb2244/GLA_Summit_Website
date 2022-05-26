import { PersonProps } from '@/Components/Form/Person'
import { Box } from '@mui/material'
import { P } from './emailComponents'

export const RegistrationEmail: React.FC<{
  person: PersonProps
  registrationLink: string
}> = ({ person, registrationLink }) => {
  const name = [person.firstName, person.lastName].join(' ')

  const headerText = (
    <>
      <P sx={{ textAlign: 'justify' }}>
        Dear {name},<br />
        <br />
        Thank you for creating an account on the GLA Summit Website!
        <br />
        <br />
        To activate your account, please follow this link:
        <br />
        <a href={registrationLink}>Validate email address</a>
        <br />
        <br />
        You can also copy and paste this URL into your web browser:
        <br />
        {registrationLink}
        <br />
        <br />
        With our best wishes,
        <br />
        GLA Summit Organizers
        <br />
        contact@glasummit.org
      </P>
    </>
  )

  return (
    <Box>
      <Box sx={{ maxWidth: '800px' }}>
        <Box>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src='https://iuqlmccpbxtgcluccazt.supabase.co/storage/v1/object/public/public-images/GLA-logo.png?t=2022-05-20T09:06:14.131Z'
            height={80}
            width={80}
            alt='GLA logo'
            style={{ float: 'right', padding: '5px' }}
          />
        </Box>
        {headerText}
      </Box>
      {/* Maybe put a banner here at the bottom? */}
    </Box>
  )
}
