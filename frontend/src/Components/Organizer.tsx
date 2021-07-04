import "../GLA-generic.css";

export type OrganizerProps = {
  firstName: string
  lastName: string
  description: string
  image?: undefined
}

export function Organizer(props: OrganizerProps) {
  return (
    <li key={props.lastName + '.' + props.firstName} className="gla-organizer-entry">
      <h4 className="gla-organizer-name">{props.firstName} {props.lastName}</h4>
      <p className="gla-organizer-description">{props.description}</p>
    </li>
  )
}