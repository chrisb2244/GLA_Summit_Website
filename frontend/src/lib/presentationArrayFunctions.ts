import { summityears, type SummitYear } from '@/lib/databaseModels';

type SplittablePresentations<T> = T & {
  year: SummitYear;
};

export function splitByYear<T>(presentations: SplittablePresentations<T>[]) {
  return summityears
    .map((year): [SummitYear, SplittablePresentations<T>[]] => [
      year,
      presentations.filter((p) => p.year === year)
    ])
    .filter(([, presentationsInYear]) => presentationsInYear.length !== 0)
    .sort((a, b) => {
      // Sort by year, latest first
      return parseInt(b[0], 10) - parseInt(a[0], 10);
    });
}
