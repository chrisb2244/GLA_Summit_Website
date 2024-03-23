import { Button } from '@/Components/Form/Button';
import { SummitYear } from '@/lib/databaseModels';
import NextLink from 'next/link';
import React from 'react';

const PresentationListLayout = async ({
  children
}: {
  children: React.ReactNode;
}) => {
  const agendaElem = (
    <>
      <p>
        For a list by schedule, see our{' '}
        <NextLink href='/full-agenda' className='link'>
          agenda
        </NextLink>
        .
      </p>
    </>
  );

  // const agendaElem = (
  //   <p>
  //     Our presentations for 2024 are currently being scheduled. Check back soon
  //     to find out when your favorite presentations will be happening!
  //   </p>
  // );

  const years: SummitYear[] = ['2024', '2022', '2021'];

  return (
    <div>
      <div className='prose mx-auto text-center [&>*]:my-0'>
        <p>
          Presentations below are grouped by year, and sorted by the first
          speaker&apos;s name.
        </p>
        {agendaElem}
      </div>

      <div className='flex flex-row space-x-4 py-2'>
        {years.map((y) => {
          return (
            <NextLink key={y} href={`/presentation-list/${y}`}>
              <Button type='button'>{y}</Button>
            </NextLink>
          );
        })}
      </div>
      <div className='prose max-w-none shadow'>{children}</div>
    </div>
  );
};

export default PresentationListLayout;
