import { Button } from '@/Components/Form/Button';
import { SummitYear } from '@/lib/databaseModels';
import NextLink from 'next/link';
import React from 'react';

const PresenterListLayout = async ({
  children
}: {
  children: React.ReactNode;
}) => {
  const years: SummitYear[] = ['2025', '2024', '2022', '2021'];

  return (
    <div>
      <div className='prose mx-auto text-center *:my-0'>
        <p>
          Presenters below are grouped by year, and sorted by surname.
        </p>
      </div>

      <div className='flex flex-row space-x-4 py-2'>
        {years.map((y) => {
          return (
            <NextLink key={y} href={`/presenter-list/${y}`}>
              <Button type='button'>{y}</Button>
            </NextLink>
          );
        })}
      </div>
      <div className='prose max-w-none shadow'>{children}</div>
    </div>
  );
};

export default PresenterListLayout;
