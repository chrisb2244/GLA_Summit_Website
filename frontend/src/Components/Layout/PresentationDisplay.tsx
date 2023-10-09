'use client';
import { PersonDisplay, PersonDisplayProps } from '@/Components/PersonDisplay';
import { mdiCalendar, mdiStarPlusOutline, mdiStarRemoveOutline } from '@mdi/js';
import Icon from '@mdi/react';
import { useEffect, useState } from 'react';
import { logErrorToDb } from '@/lib/utils';
import {
  User,
  createClientComponentClient
} from '@supabase/auth-helpers-nextjs';
import { TimestampSpan } from '../Utilities/TimestampSpan';

export type Presentation = {
  title: string;
  abstract: string;
  speakerNames: string[];
  speakers: PersonDisplayProps[];
} & Schedule;

export type Schedule =
  | {
      sessionStart: string;
      sessionEnd: string;
    }
  | {
      sessionStart: null;
      sessionEnd: null;
    };

type PresentationDisplayProps = {
  presentation: Presentation;
  timeZoneName?: string;
  presentationId: string;
  dateToStringFn?: (datetime: string) => string;
  withFavouritesButton?: boolean;
};

export const PresentationDisplay: React.FC<
  React.PropsWithChildren<PresentationDisplayProps>
> = (props) => {
  const { presentation, presentationId } = props;
  const timeZoneName = props.timeZoneName ?? 'JST';
  const dateToStringFn =
    props.dateToStringFn ??
    ((utcDateString) => {
      const date = new Date(utcDateString);
      const formatter = new Intl.DateTimeFormat(undefined, {
        timeZone: 'JST',
        hour: 'numeric',
        minute: '2-digit',
        second: undefined,
        dateStyle: undefined,
        hour12: false
      });
      return formatter.format(date);
    });
  const showFavouritesButton = props.withFavouritesButton ?? true;

  // const { user } = useSession()
  const user = null;

  // const [isFavourite, setFavourite] = useState(false)
  // useEffect(() => {
  //   supabase
  //     .from('agenda_favourites')
  //     .select('*')
  //     .eq('presentation_id', presentationId)
  //     .then(({ data, error }) => {
  //       if (error) {
  //         return
  //       }
  //       setFavourite(data !== null && data.length !== 0)
  //     })
  // }, [presentationId, supabase])

  let scheduleInfo = <></>;

  if (presentation.sessionStart !== null) {
    scheduleInfo = (
      <TimestampSpan
        utcValue={{
          start: presentation.sessionStart,
          end: presentation.sessionEnd
        }}
        dateFormat={{
          month: 'long',
          day: '2-digit'
        }}
      />
    );
  }

  const downloadButton = (
    <a href={`/api/ics/${presentationId}`} target='_blank' rel='noreferrer'>
      <div className='flex flex-row items-center'>
        <Icon path={mdiCalendar} size={1} />
        <span className='pl-1'>Download ICS file</span>
      </div>
    </a>
  );

  // const handleFavouriteClick = () => {
  //   if (user === null) {
  //     return
  //   }
  //   if (isFavourite) {
  //     // Remove from favourites
  //     supabase
  //       .from('agenda_favourites')
  //       .delete()
  //       .eq('presentation_id', presentationId)
  //       .then(({ error }) => {
  //         if (error) {
  //           logErrorToDb(error.message, 'error', user.id)
  //         }
  //       })
  //   } else {
  //     // Add to favourites
  //     supabase
  //       .from('agenda_favourites')
  //       .insert({
  //         presentation_id: presentationId,
  //         user_id: user.id
  //       })
  //       .then(({ error }) => {
  //         if (error) {
  //           logErrorToDb(error.message, 'error', user.id)
  //         }
  //       })
  //   }
  //   setFavourite(!isFavourite)
  // }

  // const favouriteButton = showFavouritesButton ? (
  //   <div
  //     className='mb-2 flex w-[fit-content] cursor-pointer flex-row rounded bg-secondaryc'
  //     onClick={() => handleFavouriteClick()}
  //   >
  //     <Icon
  //       path={isFavourite ? mdiStarRemoveOutline : mdiStarPlusOutline}
  //       size={1}
  //       className='m-2'
  //     />
  //     <span className='m-2 mr-3'>
  //       {isFavourite ? 'Remove from my agenda' : 'Add to my agenda'}
  //     </span>
  //   </div>
  // ) : null

  return (
    <div className='border-2 shadow-sm mt-1 mb-6'>
      <div className='prose mx-auto flex max-w-none flex-col space-y-4 w-11/12'>
        <div className='flex flex-col'>
          <h2 className='mt-4 mb-0'>{presentation.title}</h2>
          <div className='flex flex-col py-2 md:flex-row md:justify-between'>
            {scheduleInfo}
            {downloadButton}
          </div>
          {/* {favouriteButton} */}
          <div className='prose-p:my-1'>
            {presentation.abstract.split(/\r?\n/).map((p, idx) => {
              return <p key={`p${idx}`}>{p}</p>;
            })}
          </div>
        </div>
        <div>
          {presentation.speakers.map((personProps) => {
            return (
              <PersonDisplay
                {...personProps}
                stripContainer
                useDefaultIconImage
                key={`${personProps.lastName}_${personProps.firstName}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
