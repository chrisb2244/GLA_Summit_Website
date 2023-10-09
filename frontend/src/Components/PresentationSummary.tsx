import { PresentationType, SummitYear } from '@/lib/databaseModels';
import Link from 'next/link';
import { TimestampSpan } from './Utilities/TimestampSpan';

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
    ? pres.speakerNames.join(', ')
    : pres.speakerNames;

  // prettier-ignore
  const durationElem = (
    <span className='italic prose-sm'>
      {
        pres.presentationType === "full length" ? '45 minutes' :
        pres.presentationType === "15 minutes" ? '15 minutes' :
        pres.presentationType === "7x7" ? '7 minutes' :
        pres.presentationType === 'panel' ? 'Panel discussion' :
        'Quiz'
      }
    </span>
  )

  return (
    // <Paper {...paperProps}>
    <div className='flex flex-col border-2 p-4'>
      <Link href={`/presentations/${pres.presentationId}`}>{pres.title}</Link>
      <div className='mb-0 [&>*]:-my-1'>
        <span className='italic'>{speakerLine}</span>
        <TimestampSpan utcValue={pres.scheduledFor} />
        {durationElem}
      </div>
      <div className='line-clamp-4 prose-p:my-1'>
        {pres.abstract.split(/\r?\n/).map((p, idx) => {
          return <p key={`p${idx}`}>{p}</p>;
        })}
      </div>
    </div>
    // </Paper>
  );
};
