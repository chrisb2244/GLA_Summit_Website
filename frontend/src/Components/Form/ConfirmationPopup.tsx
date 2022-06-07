import { Box, Button, Container, Dialog, Typography } from '@mui/material'

type PopupProps = {
  open: boolean
  setClosed: () => void
  onResolve: (response: boolean) => void
}

export const ConfirmationPopup: React.FC<PopupProps> = (props) => {
  const buttonDisplayProps = {
    mb: { xs: 1, md: 0 },
    mx: 1,
    flexGrow: 1
  }

  const P: React.FC = ({ children }) => {
    return (
      <Typography align='justify' pb={2}>
        {children}
      </Typography>
    )
  }

  return (
    <>
      <Dialog open={props.open} onClose={() => props.setClosed()}>
        <Container maxWidth='md' sx={{ p: 2 }}>
          <P>
            If you submit this presentation, then it will be locked and you will
            be unable to continue to edit it.
          </P>
          <P>
            Additionally, if your presentation is accepted then the
            public-intended components (name, bio, and image) of your (and your
            co-presenters&apos;) profiles will be made public and placed alongside
            your accepted presentation.
          </P>
          <P>Please confirm that you accept this.</P>
          <Box display='flex' flexDirection={{ xs: 'column', md: 'row' }}>
            <Button
              type='submit'
              variant='outlined'
              sx={{ ...buttonDisplayProps }}
              onClick={() => props.onResolve(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
              sx={{ ...buttonDisplayProps }}
              onClick={() => props.onResolve(true)}
            >
              Confirm
            </Button>
          </Box>
        </Container>
      </Dialog>
    </>
  )
}
