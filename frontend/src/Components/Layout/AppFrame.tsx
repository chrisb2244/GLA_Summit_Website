import { Box } from '@mui/material'
import { Header } from '../Header'
import { Footer } from '../Footer'

export const AppFrame = (props: {children: React.ReactNode}) => {
  return (
    <Box flexDirection='column' display='flex' minHeight='100vh'>
      <Header />

      <Box sx={{ flex: '1 0 auto', display: 'flex' }}>
        <Box maxWidth='lg' width={{xs: '100%', md: '80%'}} mx='auto' display='flex' flexDirection='column'>
          {props.children}
        </Box>
      </Box>

      <Footer />
    </Box>
  )
}
