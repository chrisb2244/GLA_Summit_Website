'use client'
import { Box, Button, Grid, Stack, TextField } from '@mui/material'
import { useReducer, useState } from 'react'
import { clientUpdateExistingProfile } from '@/lib/databaseFunctions'
import { UserProfileImage } from './UserProfileImage'
import type { ProfileModel } from '@/lib/databaseModels'
import type { ChangeEvent } from 'react'
import type { KeyedMutator } from 'swr'

type ProfileData = ProfileModel['Row']
type ProfileKey = keyof Omit<ProfileData, 'updated_at'>

const areEqual = (a: ProfileData, b: ProfileData) => {
  if (a === null || b === null) return false
  const aKeys = Object.keys(a).filter(
    (key) => key !== 'updated_at'
  ) as Array<ProfileKey>
  const bKeys = Object.keys(b).filter(
    (key) => key !== 'updated_at'
  ) as Array<ProfileKey>
  return (
    bKeys.every(function (i) {
      return aKeys.indexOf(i) !== -1
    }) &&
    aKeys.every(function (i) {
      return a[i] === b[i]
    })
  )
}

type UserProfileProps = {
  profile: ProfileData
  userEmail: string
  mutate?: KeyedMutator<ProfileData>
}

export const UserProfile: React.FC<
  React.PropsWithChildren<UserProfileProps>
> = ({ profile, mutate, userEmail }) => {
  const [valuesChanged, setValuesChanged] = useState(false)
  const [updating, setUpdating] = useState(false)

  const submitUpdate = async () => {
    setUpdating(true)
    if (typeof mutate !== 'undefined') {
      mutate(
        () => {
          return clientUpdateExistingProfile(localProfileData)
        },
        {
          optimisticData: localProfileData,
          revalidate: false, // Acquired by the clientUpdateExistingProfile function
          rollbackOnError: true,
          populateCache: (updatedData: ProfileData) => {
            const returnedValuesEqualToSetValues = areEqual(
              updatedData,
              localProfileData
            )
            setValuesChanged(!returnedValuesEqualToSetValues)
            setUpdating(false)
            return updatedData
          }
        }
      )
    }
  }

  const updateProfileField = (
    previousLocalState: ProfileData,
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
    const newProfileData = { ...previousLocalState, [action.key]: action.value }
    setValuesChanged(!areEqual(newProfileData, profile))
    return newProfileData
  }

  const [localProfileData, setProfileField] = useReducer(
    updateProfileField,
    profile
  )

  const onChangeFn =
    (key: ProfileKey) => (ev: ChangeEvent<HTMLInputElement>) => {
      setProfileField({ key, value: ev.currentTarget.value })
    }
  const inputProps = (key: ProfileKey) => {
    return {
      value: localProfileData?.[key] ?? '',
      onChange: onChangeFn(key),
      fullWidth: true
    }
  }

  const [imageSize, setImageSize] = useState(150)

  return (
    <>
      <Stack direction={{ xs: 'column', md: 'row' }}>
        <Box m={2} width='80%' alignSelf={{ xs: 'center', md: 'flex-start' }}>
          <Box p={2}>
            <TextField fullWidth label='Email' value={userEmail} disabled />
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
                placeholder={`${localProfileData.firstname} ${localProfileData.lastname} is an awesome LabVIEW developer who hasn't yet filled out a bio...`}
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
          <UserProfileImage
            userId={profile.id}
            size={imageSize}
            avatarUrl={profile.avatar_url}
          />
        </Box>
      </Stack>
      <Button
        onClick={submitUpdate}
        disabled={
          !valuesChanged ||
          localProfileData.firstname === '' ||
          localProfileData.lastname === '' ||
          updating
        }
      >
        Update Profile
      </Button>
    </>
  )
}
