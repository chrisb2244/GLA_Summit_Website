import { Button } from '@/Components/Form/Button';
import { SummitYear } from '@/lib/databaseModels';
import type { Route } from 'next';
import Link from 'next/link';

// The subset of `summityears` shown as list-page filters (2020/2026 have no
// published content). Kept here so the presenter-list and presentation-list
// layouts stay in sync.
const displayYears: SummitYear[] = ['2025', '2024', '2022', '2021'];

/** Row of year buttons linking to `${basePath}/${year}`. */
export const YearNav = ({
  basePath
}: {
  basePath: '/presenter-list' | '/presentation-list';
}) => {
  return (
    <div className='flex flex-row space-x-4 py-2'>
      {displayYears.map((y) => {
        return (
          <Link key={y} href={`${basePath}/${y}` as Route}>
            <Button type='button'>{y}</Button>
          </Link>
        );
      })}
    </div>
  );
};
