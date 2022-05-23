import { supabase } from '@/lib/supabaseClient'
import {
  PresentationPresentersModel,
  PresentationSubmissionsModel
} from '@/lib/databaseModels'
import { useCallback, useEffect, useState } from 'react'
import { useSession } from '@/lib/sessionContext'
import { Box, Container, Stack, TextField, Typography } from '@mui/material'
import { myLog } from '@/lib/utils'
import { PresentationEditor } from '../Form/PresentationEditor'

export const UserPresentations: React.FC = () => {
  const { user } = useSession()
  const [userPresentations, setUserPresentations] = useState<
    PresentationSubmissionsModel[]
  >([])
  const [isLoading, setIsLoading] = useState(true)

  const [isMounted, setIsMounted] = useState(true)
  useEffect(() => {
    return () => {
      setIsMounted(false)
    }
  }, [])

  const getPresentations = useCallback(async () => {
    if (user == null) return
    const { data: presentationIdData, error: errorPresIds } = await supabase
      .from<PresentationPresentersModel>('presentation_presenters')
      .select('presentation_id')
      .eq('presenter_id', user.id)
    if (errorPresIds) {
      myLog({
        error: errorPresIds,
        desc: 'Failed to fetch presentations with this user as a presenter'
      })
      return
    }
    const presentationIds = presentationIdData.map((p) => p.presentation_id)
    const { data, error: errorPresData } = await supabase
      .from<PresentationSubmissionsModel>('presentation_submissions')
      .select()
      .in('id', presentationIds)
    if (errorPresData) {
      myLog({
        error: errorPresData,
        desc: 'Failed to fetch presentation details for this user'
      })
    }
    if (isMounted) {
      setUserPresentations(data ?? [])
      setIsLoading(false)
    }
  }, [user, isMounted])

  useEffect(() => {
    getPresentations()
  }, [user, getPresentations])

  if (user == null) {
    return <p>You are not signed in</p>
  } else {
    if (isLoading) {
      return <p>Loading...</p>
    }
    if (userPresentations.length === 0) {
      return <p>You don&apos;t have any draft or submitted presentations</p>
    }

    return (
      <Container>
        <Stack direction={{ xs: 'column', md: 'row' }}>
          <Box m={2} width='80%' alignSelf={{ xs: 'center', md: 'flex-start' }}>
            <Box p={2}>
              <Typography variant='subtitle1'>Draft editing is coming soon!</Typography>
            </Box>
            <Box display='flex' flexDirection='column' gap={2}>
              {userPresentations.map((p) => {
                return <PresentationEditor presentation={p} key={p.id} />
              })}
            </Box>
          </Box>
        </Stack>
      </Container>
    )
  }
}
