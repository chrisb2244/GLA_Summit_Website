import {
  formatAgendaTime,
  startsNewDay,
  type AgendaZone
} from './agendaFormatting';

export type TimeMarkerProps = {
  startDate: Date;
  durationInHours?: number;
  pixelsPerMinute: number;
  zone: AgendaZone;
};

/**
 * Hourly labels down the left gutter. These are position-mapped to times, so
 * they must scroll with the blocks — the gutter is deliberately not sticky.
 *
 * The window is 24 hours from noon UTC, which crosses local midnight for almost
 * every viewer. The first label of the new day is highlighted to aid readability.
 */
export const TimeMarkers = (props: TimeMarkerProps) => {
  const duration = props.durationInHours
    ? Math.round(props.durationInHours)
    : 24;

  const markers = Array.from({ length: duration + 1 }, (_, idx) => {
    const time = new Date(props.startDate.getTime() + idx * 60 * 60 * 1000);
    return {
      time,
      position: idx * 60 * props.pixelsPerMinute
    };
  });

  return (
    <>
      {markers.map(({ time, position }, idx, markersArray) => {
        const previousTime = idx > 0 ? markersArray[idx - 1].time : null;
        const isNewDay =
          previousTime !== null && startsNewDay(time, previousTime, props.zone);
        return (
          <span
            key={time.getTime()}
            className={`absolute left-[0.5ch] text-sm ${
              isNewDay ? 'text-primaryc font-bold' : ''
            }`}
            style={{ top: `calc(${position}px - 0.75em)` }}
          >
            {formatAgendaTime(time, props.zone)}
          </span>
        );
      })}
    </>
  );
};
