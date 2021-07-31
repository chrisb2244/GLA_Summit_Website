import React from 'react'
import ReactDOM from 'react-dom'
// import '../index.css'
import App from '../App'
import reportWebVitals from '../reportWebVitals'

import { Grid, Typography } from '@material-ui/core'

export const HomePage: React.FC = (props) => {
  return (
    <>
      <Grid container item style={{ margin: '0 auto' }} xs={8} md={6}>
        <Typography>
          In collaboration with the Certified LabVIEW Architect community and NI,
          we’d like to welcome all LabVIEW Architects (certified or self-proclaimed)
          to join us in our second Global LabVIEW Architects' Summit!
          This is an exciting opportunity for advanced LabVIEW developers from around
          the world to network and participate in a more inclusive, all-digital, free event.
        </Typography>
      </Grid>
    </>
  )
}

export default App


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
