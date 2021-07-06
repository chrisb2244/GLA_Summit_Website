import { ReactElement } from "react";
import { Grid } from "@material-ui/core";
import "../GLA-generic.css";

export type OrganizerProps = {
  firstName: string
  lastName: string
  description: string | ReactElement
  image?: string
  imageSide?: "left" | "right"
}

export function Organizer(props: OrganizerProps) {
  const direction = props.imageSide ? (props.imageSide === "right" ? "row" : "row-reverse") : "row"

  let imageElem = null
  if (props.image) {
    const path = `/media/${props.image}`
    const image = <img src={path} alt={`${props.lastName} ${props.firstName}`} style={{ width: "90%" }} />
    imageElem = <Grid item xs={12} md={4}>{image}</Grid>
  }

  return (
    <Grid container
      key={props.lastName + '.' + props.firstName}
      className="gla-organizer-entry"
      spacing={3}
      direction={direction}
      alignItems="center"
    >
      <Grid item xs={12} md={props.image ? 8 : 12}>
        <h4 className="gla-organizer-name">{props.firstName} {props.lastName}</h4>
        <p className="gla-organizer-description">{props.description}</p>
      </Grid>
      {imageElem}
    </Grid>
  )
}