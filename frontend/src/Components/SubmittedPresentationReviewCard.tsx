'use client';

import { PresentationType } from '@/lib/databaseModels';
import { Disclosure, Transition } from '@headlessui/react';
import { formatTextToPs } from '@/lib/utils';

export type PersonInfo = {
  id: string;
  firstname: string;
  lastname: string;
};

export type PresentationReviewInfo = {
  title: string;
  abstract: string;
  submitter: PersonInfo;
  presenters: PersonInfo[];
  learning_points: string;
  presentation_id: string;
  presentation_type: PresentationType;
  updated_at: string;
};

type SubmittedPresentationReviewCardProps = {
  presentationInfo: PresentationReviewInfo;
};

export const SubmittedPresentationReviewCard: React.FC<
  React.PropsWithChildren<SubmittedPresentationReviewCardProps>
> = (props) => {
  const getName = (person: PersonInfo) => {
    const joinedNamesOmitEmpty = [person.firstname, person.lastname]
      .filter((s) => s.trim().length !== 0)
      .join(' ');
    return joinedNamesOmitEmpty.trim().length !== 0
      ? joinedNamesOmitEmpty
      : 'Unknown User';
  };

  const p = props.presentationInfo;

  return (
    <div className='prose w-full max-w-full rounded-lg shadow'>
      <Disclosure>
        <Disclosure.Button
          // as='div' {/* This is required to put buttons in the Button */}
          className='w-full rounded-lg bg-gray-100 ui-open:rounded-b-none ui-open:bg-gray-200'
        >
          <div className='flex flex-row'>
            <div className='mx-2 my-1 flex-1'>
              <h3 className='my-0 text-inherit'>{p.title}</h3>
              <span className='italic'>{`Submitter: ${getName(
                p.submitter
              )}`}</span>
            </div>
            {/* <div>
              <button>Vote Up</button>
              <button>Vote Down</button>
            </div> */}
          </div>
        </Disclosure.Button>
        <Transition>
          <Disclosure.Panel className='rounded-b-lg bg-gray-100'>
            <span>
              {'Presenters: '}
              {p.presenters.map((name, idx, arr) => {
                const nameString = getName(name);
                return (
                  <span
                    className={nameString === 'Unknown User' ? 'italic' : ''}
                    key={`rev-presname-${idx}`}
                  >
                    {nameString + (idx !== arr.length - 1 ? ', ' : '')}
                  </span>
                );
              })}
            </span>
            <div className='mt-2 prose-p:my-0'>
              {formatTextToPs(p.abstract)}
            </div>
          </Disclosure.Panel>
        </Transition>
      </Disclosure>
    </div>
  );
};
