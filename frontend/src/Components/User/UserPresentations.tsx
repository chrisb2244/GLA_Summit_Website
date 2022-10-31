import { Box, Container, Stack, Typography } from '@mui/material'
import { PresentationEditor } from '../Forms/PresentationEditor'
import { PersonProps } from '../Form/Person'
import {
  FormData,
  PresentationLockedStatus
} from '@/Components/Forms/PresentationSubmissionFormCore'
import { deletePresentation, getMyPresentations } from '@/lib/databaseFunctions'
import type { MySubmissionsModel } from '@/lib/databaseModels'
import type { KeyedMutator } from 'swr'

type UserPresentationsProps = {
  presentations: MySubmissionsModel[]
  userId: string
  mutate: KeyedMutator<MySubmissionsModel[]>
}

export const UserPresentations: React.FC<React.PropsWithChildren<UserPresentationsProps>> = ({
  presentations,
  userId,
  mutate
}) => {
  if (presentations.length === 0) {
    return <p>You don&apos;t have any draft or submitted presentations</p>
  }

  const presentationToEditorComponent = (p: MySubmissionsModel) => {
    const isCopresenter = p.submitter_id !== userId
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
          mutate(
            () => {
              return deletePresentation(p.presentation_id).then(() =>
                getMyPresentations()
              )
            },
            {
              revalidate: false
            }
          )
        }}
        updateCallback={async (formData: FormData) => {
          fetch('/api/handlePresentationSubmission', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              formdata: formData,
              submitterId: userId,
              sendEmails: false,
              presentationId: p.presentation_id
            })
          })
          mutate(() => {
            return getMyPresentations()
          })
        }}
      />
    )
  }

  const draftList = presentations
    .filter((p) => !p.is_submitted)
    .map(presentationToEditorComponent)
  const submittedList = presentations
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
// }
