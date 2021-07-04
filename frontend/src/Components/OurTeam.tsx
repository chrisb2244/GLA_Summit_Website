import { Organizer } from "./Organizer";

export function OurTeam(props: {}) {
  return (
    <ul>
      <Organizer firstName="Chris" lastName="Stryker" description="A previous organizer" />
      <Organizer firstName="Christian" lastName="Butcher" description="Another person" />
    </ul>
  );
}