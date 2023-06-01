import type { PresentationYear } from '@/Components/PresentationSummary'

type SplittablePresentations<T> = T & {
  year: PresentationYear
}

type EntriesType<T> = [PresentationYear, SplittablePresentations<T>[]][]

export function splitByYear<T>(presentations: SplittablePresentations<T>[]) {
  const groupedPresentationProps: {
    [key in PresentationYear]?: SplittablePresentations<T>[]
  } = {
    '2023': presentations.filter((p) => p.year === '2023'),
    '2022': presentations.filter((p) => p.year === '2022'),
    '2021': presentations.filter((p) => p.year === '2021'),
    '2020': presentations.filter((p) => p.year === '2020')
  }

  const presentationsByYear = (
    Object.entries(groupedPresentationProps) as EntriesType<T>
  )
    .sort((a, b) => {
      // Sort by year, latest first
      return parseInt(b[0], 10) - parseInt(a[0], 10)
    })
    .filter((v) => v[1].length !== 0)

  return presentationsByYear
}
