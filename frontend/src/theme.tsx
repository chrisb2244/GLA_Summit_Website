import { createTheme, responsiveFontSizes } from '@mui/material'

/*
Color values

Primary brand #5837b9
White #fff
Light Gray #e7e9e8
Medium Gray #8b908e
Dark Gray #3e4342

Extended palette
Secondary brand #a25bcd
White T #f5f5f5
Light Gray T #c9cbca
Medium Gray T #6d7270
Dark Gray T #202524

Font Sizes
48pt Roboto Condensed
32pt Bold Roboto
24pt Bold Roboto
20pt Medium Roboto
16pt Black Roboto - Uppercase
16pt Regular Roboto
*/
export const theme = responsiveFontSizes(createTheme({
  palette: {
    primary: {
      main: '#5837b9'
      // main: '#fff'
    },
    background: {
      // default: '#a25bcd'
      default: '#fff'
    },
    text: {
      // primary: '#fff',
      primary: '#000',
      secondary: '#3e4342',
      disabled: '#e7e9e8'
    }
  },
  typography: {
    fontFamily: 'Roboto',
    fontSize: 16
  },
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 5
      }
    }
  }
}))
