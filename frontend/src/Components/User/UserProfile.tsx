import { getProfileInfo, supabase } from '@/lib/supabaseClient'
import type { ProfileModel } from '@/lib/supabaseClient'
import type { PostgrestError } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { useSession } from '@/lib/sessionContext'
import { Box, Button, Container, Grid, TextField } from '@mui/material'

export const UserProfile: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState<ProfileModel | null>(null)
  const session = useSession()

  const updateProfileField = (key: keyof ProfileModel, value: string) => {
    if (profileData == null) return
    const newProfileData = { ...profileData, [key]: value }
    console.log(newProfileData)
    setProfileData(newProfileData)
  }

  async function updateProfile() {
    if (session == null) return
    try {
      if (profileData == null) return
      setLoading(true)

      const { error } = await supabase.from<ProfileModel>('profiles').upsert(
        { ...profileData, id: session.user?.id },
        {
          returning: 'minimal' // Don't return the value after inserting
        }
      )

      if (error) {
        throw error
      }
    } catch (error) {
      alert((error as PostgrestError).message)
    } finally {
      setLoading(false)
    }
  }

  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    getProfileInfo()
      .then((data) => {
        if (isMounted) {
          setProfileData(data)
        }
      })
      .catch((error) => {
        console.log(error as PostgrestError)
      })
    setLoading(false)
  }, [session])

  if (session == null || session.user == null) {
    return <p>You are not signed in</p>
  } else {
    if (profileData == null) {
      return <p>Loading...</p>
    }
    return (
      <Container>
        <Box m={2}>
          <Box p={2}>
            <TextField
              fullWidth
              label='Email'
              value={session.user.email ?? ''}
              disabled
            />
          </Box>
          <Grid container p={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label='First Name'
                name='First Name'
                id='firstname'
                value={profileData.firstname ?? ''}
                onChange={(ev) =>
                  updateProfileField('firstname', ev.currentTarget.value)
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label='Last Name'
                value={profileData.lastname ?? ''}
                onChange={(ev) =>
                  updateProfileField('lastname', ev.currentTarget.value)
                }
              />
            </Grid>
          </Grid>
          <Button onClick={updateProfile}>Update Profile</Button>
        </Box>
      </Container>
    )
  }
}
