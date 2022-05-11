import { Box, Typography, TypographyProps } from '@mui/material'

export const MaintenancePage: React.FC = () => {
  const TextElem: React.FC<TypographyProps> = ({ children, ...other }) => {
    return (
      <Typography textAlign='center' color='text.secondary' {...other}>
        {children}
      </Typography>
    )
  }

  return (
    <>
      <Box
        flexDirection='column'
        display='flex'
        minHeight='100vh'
        justifyContent='center'
        bgcolor='primary.main'
      >
        <Box
          bgcolor='secondary.main'
          maxWidth='lg'
          mx='auto'
          p={3}
          borderRadius={'25px'}
        >
          <TextElem variant='h1'>GLA Summit 2022</TextElem>
          <Box>
            <TextElem variant='h5'>
              We&apos;re excited to be preparing a new page for GLA Summit 2022!
            </TextElem>
            <TextElem variant='subtitle1'>
              2022/11/14 12:00 UTC - 2022/11/15 12:00 UTC
            </TextElem>
          </Box>
        </Box>
      </Box>
    </>
  )
}
