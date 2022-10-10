import { Box, Button, Container, Dialog } from '@mui/material'

export type PopupProps = {
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

  const resolveFn = (response: boolean) => {
    props.setClosed()
    props.onResolve(response)
  }

  return (
    <>
      <Dialog open={props.open} onClose={() => props.setClosed()}>
        <Container maxWidth='md' sx={{ p: 2 }}>
          {props.children}
          <Box display='flex' flexDirection={{ xs: 'column', md: 'row' }}>
            <Button
              type='submit'
              variant='outlined'
              sx={{ ...buttonDisplayProps }}
              onClick={() => resolveFn(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
              sx={{ ...buttonDisplayProps }}
              onClick={() => resolveFn(true)}
            >
              Confirm
            </Button>
          </Box>
        </Container>
      </Dialog>
    </>
  )
}
