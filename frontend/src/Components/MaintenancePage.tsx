import { Box, Typography } from '@mui/material'
import type { BoxProps, TypographyProps } from '@mui/material'

export const MaintenancePage: React.FC = () => {
  const TextElem: React.FC<TypographyProps> = ({ children, ...other }) => {
    return (
      <Typography textAlign='center' color='text.secondary' {...other}>
        {children}
      </Typography>
    )
  }

  const PurpleBox: React.FC<BoxProps> = ({ children, ...other }) => {
    return (
      <Box
        bgcolor='secondary.main'
        maxWidth={{ md: 'lg', xs: '90%' }}
        mx='auto'
        p={3}
        borderRadius={'25px'}
        {...other}
      >
        {children}
      </Box>
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
        <PurpleBox marginBottom={3}>
          <TextElem variant='h1'>GLA Summit 2022</TextElem>
          <TextElem variant='h4'>14th - 15th November 2022</TextElem>
        </PurpleBox>
        <PurpleBox>
          <TextElem variant='body1' sx={{ fontSize: '28px !important' }}>
            We&apos;re excited to be preparing a new page for GLA Summit 2022!
          </TextElem>
          <TextElem variant='body1' sx={{ fontSize: '28px !important' }}>
            Check back soon for updates
          </TextElem>
        </PurpleBox>
      </Box>
    </>
  )
}
