import { MySubmissionsModel } from '@/lib/databaseModels'
import { useCallback, useEffect, useState } from 'react'
import { useSession } from '@/lib/sessionContext'
import { Box, Container, Stack, Typography } from '@mui/material'
import { PresentationEditor } from '../Forms/PresentationEditor'
import { PersonProps } from '../Form/Person'
import {
  FormData,
  PresentationLockedStatus
} from '@/Components/Forms/PresentationSubmissionFormCore'
import { deletePresentation, getMyPresentations } from '@/lib/databaseFunctions'

export const UserPresentations: React.FC = () => {
  const { user } = useSession()
  const [userPresentations, setUserPresentations] = useState<
    MySubmissionsModel[]
  >([])
  const [isLoading, setIsLoading] = useState(true)

  const [isMounted, setIsMounted] = useState(true)
  useEffect(() => {
    return () => {
      setIsMounted(false)
    }
  }, [])

  const getPresentations = useCallback(async () => {
    const myPresentations = (await getMyPresentations(user)) ?? []
    if (isMounted) {
      setUserPresentations(myPresentations)
      setIsLoading(false)
    }
  }, [user, isMounted])

  useEffect(() => {
    getPresentations()
  }, [getPresentations])

  if (user == null) {
    return <p>You are not signed in</p>
  } else {
    if (isLoading) {
      return <p>Loading...</p>
    }
    if (userPresentations.length === 0) {
      return <p>You don&apos;t have any draft or submitted presentations</p>
    }

    const presentationToEditorComponent = (p: MySubmissionsModel) => {
      const isCopresenter = p.submitter_id !== user?.id
      const isSubmitted = p.is_submitted
      const lockStatus: PresentationLockedStatus = {
        isCopresenter,
        isSubmitted
      }
      const submitterIdx = p.all_presenters_ids.findIndex(
        (id) => p.submitter_id === id
      )
      const submitter: PersonProps = {
        email: p.all_emails[submitterIdx],
        firstName: p.all_firstnames[submitterIdx],
        lastName: p.all_lastnames[submitterIdx]
      }
      return (
        <PresentationEditor
          presentation={p}
          key={p.presentation_id}
          submitter={submitter}
          lockStatuses={lockStatus}
          deleteCallback={async () => {
            setUserPresentations((existing) => [
              ...existing.filter(
                (p2) => p2.presentation_id !== p.presentation_id
              )
            ])
            deletePresentation(p.presentation_id)
          }}
          updateCallback={async (formData: FormData) => {
            fetch('/api/handlePresentationSubmission', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                formdata: formData,
                submitterId: user?.id,
                sendEmails: false,
                presentationId: p.presentation_id
              })
            })
            return getPresentations()
          }}
        />
      )
    }

    const draftList = userPresentations
      .filter((p) => !p.is_submitted)
      .map(presentationToEditorComponent)
    const submittedList = userPresentations
      .filter((p) => p.is_submitted)
      .map(presentationToEditorComponent)

    return (
      <Container>
        <Stack direction={{ xs: 'column', md: 'row' }}>
          <Box
            m={2}
            width={{ xs: '95%', md: '80%' }}
            alignSelf={{ xs: 'center', md: 'flex-start' }}
          >
            <Box p={2}>
              <Typography variant='subtitle1'>
                Your presentations are shown below:
              </Typography>
            </Box>
            <Stack direction='column' spacing={1} mb={3}>
              <Typography variant='h5'>Drafts</Typography>
              <Box display='flex' flexDirection='column' gap={2}>
                {draftList}
              </Box>
            </Stack>
            <Stack direction='column' spacing={1} mb={3}>
              <Typography variant='h5'>Submitted Presentations</Typography>
              <Box display='flex' flexDirection='column' gap={2}>
                {submittedList}
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Container>
    )
  }
}
