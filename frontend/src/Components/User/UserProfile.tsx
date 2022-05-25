import { supabase } from '@/lib/supabaseClient'
import type { ProfileModel } from '@/lib/databaseModels'
import type { PostgrestError } from '@supabase/supabase-js'
import { useEffect, useReducer, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useSession } from '@/lib/sessionContext'
import { Box, Button, Container, Grid, Stack, TextField } from '@mui/material'
import { UserProfileImage } from './UserProfileImage'

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
  const [storedProfileData, setStoredProfileData] =
    useState<ProfileModel | null>(null)
  const [valuesChanged, setValuesChanged] = useState(false)

  const { profile, user } = useSession()

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
    if (user == null) return
    try {
      if (profileData == null) return

      const { error } = await supabase.from<ProfileModel>('profiles').upsert(
        { ...profileData, id: user.id },
        { returning: 'minimal' } // Don't return the value after inserting
      )

      if (error) {
        throw error
      }
      setStoredProfileData(profileData)
      setValuesChanged(false)
    } catch (error) {
      alert((error as PostgrestError).message)
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
    setProfileField({ type: 'init', value: profile })
    setStoredProfileData(profile)
  }, [profile])

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

  const [imageSize, setImageSize] = useState(150)

  if (user == null) {
    return <p>You are not signed in</p>
  } else {
    if (profileData == null) {
      return <p>Loading...</p>
    }
    return (
      <>
        <Stack direction={{ xs: 'column', md: 'row' }}>
          <Box m={2} width='80%' alignSelf={{ xs: 'center', md: 'flex-start' }}>
            <Box p={2}>
              <TextField
                fullWidth
                label='Email'
                value={user.email ?? ''}
                disabled
              />
            </Box>
            <Grid container p={2} spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label='First Name' {...inputProps('firstname')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label='Last Name' {...inputProps('lastname')} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  multiline
                  minRows={5}
                  label='Biography'
                  {...inputProps('bio')}
                  placeholder={`${profileData.firstname} ${profileData.lastname} is an awesome LabVIEW developer who hasn't yet filled out a bio...`}
                />
              </Grid>
            </Grid>
          </Box>
          <Box
            width={{ xs: '80%', md: '20%' }}
            alignSelf='center'
            ref={(box: HTMLDivElement | null) => {
              if (box) setImageSize(box.clientWidth)
            }}
          >
            <UserProfileImage userId={user.id} size={imageSize} />
          </Box>
        </Stack>
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
      </>
    )
  }
}
