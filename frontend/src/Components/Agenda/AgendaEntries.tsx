import {
  applyTimeScaling,
  calculatePositioningInfo,
  type AgendaEntryKind,
  type ContainerHint,
  type PlottedEntry,
  type PresentationSlot
} from './AgendaCalculations';
import {
  describeEntry,
  formatAgendaTimeRange,
  kindLabel,
  type AgendaZone
} from './agendaFormatting';

export type AgendaEntriesProps = {
  slots: PresentationSlot[];
  pixelsPerMinute: number;
  start: Date;
  windowEnd: Date;
  favourites?: string[];
  containerHints?: ContainerHint[];
  zone: AgendaZone;
};

/**
 * Drawn heights depend on duration and PIXELS_PER_MINUTE. Reveal detail as
 * height allows; `describeEntry` still supplies the whole thing to assistive
 * technology and to the hover tooltip, so nothing is actually lost.
 */
const SHOW_SPEAKERS_ABOVE_PX = 34;
const SHOW_TIME_ABOVE_PX = 60;
const SHOW_BADGE_ABOVE_PX = 44;

const blockClassesByKind: Record<AgendaEntryKind, string> = {
  // White on primaryc (#5837b9) clears AA at any size.
  // The border is lighter than the fill so that two blocks stacked in one column
  // are clearly separated.
  session: 'border border-white/40 bg-primaryc text-white',
  // Style non-linked elements differently.
  stage: 'border-2 border-primaryc bg-primaryc/10 text-primaryc',
  'expert-bar':
    'border-2 border-dashed border-secondaryc bg-secondaryc/10 text-primaryc'
};

const EntryContent = ({
  entry,
  zone
}: {
  entry: PlottedEntry;
  zone: AgendaZone;
}) => {
  const height = entry.style.height;
  const badge = kindLabel(entry.kind);
  const speakerLine = entry.speakers.join(', ');

  return (
    <>
      {/* The visible content may be truncated, so use a separate sr-only element
          for accessibility values */}
      <span
        aria-hidden='true'
        className='flex w-full flex-col items-center overflow-hidden px-[0.75ch] py-px text-center leading-tight'
      >
        {badge !== null && height >= SHOW_BADGE_ABOVE_PX && (
          <span className='text-[0.7rem] font-semibold tracking-wide uppercase'>
            {badge}
          </span>
        )}
        <span className='text-xs font-medium text-balance'>{entry.title}</span>
        {speakerLine !== '' && height >= SHOW_SPEAKERS_ABOVE_PX && (
          <span className='text-[0.65rem] italic'>{speakerLine}</span>
        )}
        {height >= SHOW_TIME_ABOVE_PX && (
          <span className='text-[0.65rem]'>
            {formatAgendaTimeRange(entry.startTime, entry.endTime, zone)}
          </span>
        )}
      </span>
      <span className='sr-only'>{describeEntry(entry, zone)}</span>
    </>
  );
};

export const AgendaEntries = (props: AgendaEntriesProps) => {
  const hints = calculatePositioningInfo(
    props.slots,
    props.start.getTime(),
    props.containerHints,
    props.windowEnd.getTime()
  );

  const plotted = applyTimeScaling(hints, props.pixelsPerMinute);

  return (
    <>
      {plotted.map((entry) => {
        const favourite = props.favourites?.includes(entry.id)
          ? ' favourite-session'
          : '';
        // Positioning lives on the outermost element so that the click target
        // has defined size.
        const className = `absolute flex items-center justify-center overflow-hidden ${blockClassesByKind[entry.kind]}${favourite}`;
        const description = describeEntry(entry, props.zone);

        if (entry.link === null) {
          return (
            <div
              key={entry.id}
              className={className}
              style={entry.style}
              title={description}
            >
              <EntryContent entry={entry} zone={props.zone} />
            </div>
          );
        }

        return (
          <a
            key={entry.id}
            href={entry.link}
            className={`${className} hover:bg-primaryc-light no-underline`}
            style={entry.style}
            title={description}
          >
            <EntryContent entry={entry} zone={props.zone} />
          </a>
        );
      })}
    </>
  );
};
