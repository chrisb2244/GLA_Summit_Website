import { getProfileInfo, supabase } from '@/lib/supabaseClient'
import type { ProfileModel } from '@/lib/supabaseClient'
import type { PostgrestError } from '@supabase/supabase-js'
import { useEffect, useReducer, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useSession } from '@/lib/sessionContext'
import { Box, Button, Container, Grid, TextField } from '@mui/material'

type ProfileData = ProfileModel | null
type ProfileKey = keyof ProfileModel

const areEqual = (a: ProfileData, b: ProfileData) => {
  if (a === null || b === null) return false
  const aKeys = Object.keys(a) as Array<ProfileKey>
  const bKeys = Object.keys(b) as Array<ProfileKey>
  return (
    bKeys.every(function (i) {
      return aKeys.indexOf(i) !== -1
    }) &&
    aKeys.every(function (i) {
      return a[i] === b[i]
    })
  )
}

export const UserProfile: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [storedProfileData, setStoredProfileData] =
    useState<ProfileModel | null>(null)
  const [valuesChanged, setValuesChanged] = useState(false)

  const session = useSession()

  const updateProfileField = (
    profile: ProfileData,
    action:
      | {
          type?: 'update'
          key: ProfileKey
          value: string
        }
      | {
          type: 'init'
          value: ProfileData
        }
  ): ProfileData => {
    if (action.type === 'init') return action.value
    if (profile == null) return null
    const newProfileData = { ...profile, [action.key]: action.value }
    setValuesChanged(!areEqual(newProfileData, storedProfileData))
    return newProfileData
  }

  const [profileData, setProfileField] = useReducer(updateProfileField, null)

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
      setStoredProfileData(profileData)
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
          setProfileField({ type: 'init', value: data })
          setStoredProfileData(data)
        }
      })
      .catch((error) => {
        console.log(error as PostgrestError)
      })
    setLoading(false)
  }, [session])

  const onChangeFn =
    (key: ProfileKey) => (ev: ChangeEvent<HTMLInputElement>) => {
      setProfileField({ key, value: ev.currentTarget.value })
    }
  const inputProps = (key: ProfileKey) => {
    return {
      value: profileData?.[key] ?? '',
      onChange: onChangeFn(key),
      fullWidth: true
    }
  }

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
              <TextField label='First Name' {...inputProps('firstname')} />
            </Grid>
            <Grid item xs={6}>
              <TextField label='Last Name' {...inputProps('lastname')} />
            </Grid>
          </Grid>
          <Button
            onClick={updateProfile}
            disabled={
              !valuesChanged ||
              profileData.firstname === '' ||
              profileData.lastname === ''
            }
          >
            Update Profile
          </Button>
        </Box>
      </Container>
    )
  }
}
