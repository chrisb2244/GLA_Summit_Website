import { Box } from '@mui/material'
import { Header } from '../Header'
import { Footer } from '../Footer'

export const AppFrame: React.FC = (props) => {
  return (
    <Box flexDirection='column' display='flex' minHeight='100vh'>
      <Header />

      <Box sx={{ flex: '1 0 auto', '> *': { maxWidth: '80%', mx: 'auto' } }}>
        {props.children}
      </Box>

      <Footer />
    </Box>
  )
}
