export type TimeMarkerProps = {
  startDate: Date;
  durationInHours?: number;
  pixelsPerMinute: number;
  stringFormatter: (d: Date) => string;
};

export const TimeMarkers = (props: TimeMarkerProps) => {
  const duration = props.durationInHours
    ? Math.round(props.durationInHours)
    : 24;

  const timeMarkers = new Array(duration + 1)
    .fill(0)
    .map((v, idx) => {
      const tOffset = idx * 60 * 60 * 1000;
      return new Date(props.startDate.getTime() + tOffset);
    })
    .map((t) => {
      const minutesAfterStart =
        (t.getTime() - props.startDate.getTime()) / (60 * 1000);
      return {
        time: t,
        timeString: props.stringFormatter(t),
        position: minutesAfterStart * props.pixelsPerMinute
      };
    })
    .map((tMark) => {
      return (
        <span
          style={{
            position: 'absolute',
            display: 'inline',
            top: `calc(${tMark?.position}px - 0.75em)`,
            left: '0.5ch'
          }}
          key={tMark.time.getTime()}
        >
          {tMark.timeString}
        </span>
      );
    });

  return <>{timeMarkers}</>;
};
