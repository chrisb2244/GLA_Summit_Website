import { supabase } from '@/lib/supabaseClient'
import { PresentationPresentersModel, PresentationSubmissionsModel, ProfileModel } from '@/lib/databaseModels'
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

export const UserPresentations: React.FC = () => {
  const { profile, user } = useSession()
  const [userPresentations, setUserPresentations] = useState<PresentationSubmissionsModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const getPresentations = async () => {
    if(user == null) return
    const { data: presentationIdData, error: errorPresIds } = await supabase.from<PresentationPresentersModel>('presentation_presenters').select('presentation_id').eq('presenter_id', user.id)
    if (errorPresIds) {
      console.log({error: errorPresIds, desc: 'Failed to fetch presentations with this user as a presenter'})
      return
    }
    const presentationIds = presentationIdData.map(p => p.presentation_id)
    const { data, error: errorPresData } = await supabase.from<PresentationSubmissionsModel>('presentation_submissions').select().in('id', presentationIds)
    if (errorPresData) {
      console.log({error: errorPresData, desc: 'Failed to fetch presentation details for this user'})
    }
    if (isMounted) {
      setUserPresentations(data ?? [])
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getPresentations()
  }, [user])


  if (user == null) {
    return <p>You are not signed in</p>
  } else {
    if(isLoading) {
      return <p>Loading...</p>
    }
    if (userPresentations.length === 0) {
      return <p>You don't have any draft or submitted presentations</p>
    }

    return (
      <Container>
        <Stack direction={{ xs: 'column', md: 'row' }}>
          <Box m={2} width='80%' alignSelf={{xs: 'center', md: 'flex-start'}}>
            <Box p={2}>
              <TextField
                fullWidth
                label='Email'
                value={user.email ?? ''}
                disabled
              />
            </Box>
            <Grid container p={2} spacing={2}>
              {userPresentations.map(p => {
                return <p key={p.id}>{p.title}</p>
              })}
            </Grid>
          </Box>
        </Stack>
      </Container>
    )
  }
}
