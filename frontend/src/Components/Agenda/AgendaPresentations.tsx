import { getSessionDurationInMinutes } from '@/lib/utils';
import { ScheduledAgendaEntry } from './Agenda';
import {
  applyTimeScaling,
  calculatePositioningInfo,
  ContainerHint,
  PresentationSlot
} from './AgendaCalculations';

export type AgendaPresentationProps = {
  presentations: ScheduledAgendaEntry[];
  width: number;
  pixelsPerMinute: number;
  favourites?: string[];
  containerHints?: ContainerHint[];
  start?: Date;
};

export const AgendaPresentations = (props: AgendaPresentationProps) => {
  const earliestStart =
    props.start?.getTime() ??
    props.presentations.reduce(
      (foundTime, presentationToConsider) => {
        return Math.min(
          foundTime,
          new Date(presentationToConsider.scheduled_for).getTime()
        );
      },
      new Date(Date.UTC(2999, 1, 1)).getTime()
    ); // very large start value
  const presentationSlots = props.presentations.map((p): PresentationSlot => {
    const startTime = new Date(p.scheduled_for);
    const durationMins = getSessionDurationInMinutes(
      p.presentation_type,
      'agenda-window'
    );
    const endTime = new Date(startTime.getTime() + durationMins * 60 * 1000);
    let link = '/presentations/' + p.presentation_id;
    if (p.presentation_type === 'panel') {
      // ToDo - in a future year, fix this rather than being hardcoded
      const isOS = p.title === 'How to make Open-Source more worthwhile?';
      link = '/panels/' + (isOS ? 'open-source' : 'labview-and-python');
    }
    return {
      id: p.presentation_id,
      durationMinutes: durationMins,
      startTime,
      endTime,
      title: p.title,
      link
    };
  });

  const plottingHints = calculatePositioningInfo(
    presentationSlots,
    earliestStart,
    props.containerHints
  );

  const plottingInfo = applyTimeScaling(
    plottingHints,
    props.pixelsPerMinute,
    props.width
  );

  const itemsToRender = plottingInfo.map((p) => {
    const favouriteTag = props.favourites?.includes(p.id)
      ? 'favourite-session'
      : '';

    return (
      <a href={p.link} key={p.id}>
        <div
          className={`absolute flex items-center justify-center overflow-clip bg-secondaryc bg-clip-content p-[1px] text-center text-white ${favouriteTag}`}
          style={p.style}
        >
          <span className='z-10 m-auto px-[1.5ch]'>{p.title}</span>
        </div>
      </a>
    );
  });

  return <>{itemsToRender}</>;
};
