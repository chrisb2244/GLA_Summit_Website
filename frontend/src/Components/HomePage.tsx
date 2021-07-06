import { Grid } from "@material-ui/core"
import { Typography } from "@material-ui/core"

export function HomePage(props: {}) {
  return (
    <>
      <Grid container item style={{margin:"0 auto"}} xs={8} md={6}>
        <Typography>
          In collaboration with the Certified LabVIEW Architect community and NI,
          we’d like to welcome all LabVIEW Architects (certified or self-proclaimed)
          to join us in our second Global LabVIEW Architects' Summit!
          This is an exciting opportunity for advanced LabVIEW developers from around
          the world to network and participate in a more inclusive, all-digital, free event.
        </Typography>
      </Grid>
    </>
  )
}