import { ListCard } from '@/Components/Layout/ListCard';
import { PresentationType, SummitYear } from '@/lib/databaseModels';
import Link from 'next/link';
import { TimestampSpan } from './Utilities/TimestampSpan';
import { formatTextToPs } from '@/lib/utils';

export type Presenter = {
  firstname: string;
  lastname: string;
};
export type Presentation = {
  title: string;
  abstract: string;
  speakers: Presenter | Presenter[];
  speakerNames: string | string[];
  presentationId: string;
  year: SummitYear;
  scheduledFor: string | null;
  presentationType: PresentationType;
};

export type PresentationProps = {
  presentation: Presentation;
};

export const PresentationSummary = (props: PresentationProps) => {
  const { presentation: pres } = props;

  const speakerLine = Array.isArray(pres.speakerNames)
    ? pres.speakerNames.filter((s) => s.trim() !== '').join(', ')
    : pres.speakerNames;

  // prettier-ignore
  const durationString = pres.presentationType === "full length" ? '45 minutes' :
  pres.presentationType === "15 minutes" ? '15 minutes' :
  pres.presentationType === "7x7" ? '7 minutes' :
  pres.presentationType === 'panel' ? 'Panel discussion' :
  'Quiz'

  return (
    <ListCard className='flex flex-col'>
      <Link href={`/presentations/${pres.presentationId}`} className='link'>
        {pres.title}
      </Link>
      <div className='mb-0 flex flex-col -space-y-0.5 prose prose-sm'>
        <span className='prose italic'>{speakerLine}</span>
        <TimestampSpan utcValue={pres.scheduledFor} />
        <span className='italic'>{durationString}</span>
      </div>
      {/* The abstract is user-authored content, so it carries its own `prose`
          scope (the list layout no longer provides one). */}
      <div className='prose prose-p:my-1 line-clamp-4 max-w-none'>
        {formatTextToPs(pres.abstract)}
      </div>
    </ListCard>
  );
};
