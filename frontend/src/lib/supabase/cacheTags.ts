import { SummitYear } from '../databaseModels';

export const CACHE_TAGS = {
  acceptedPresenterIds: 'presenters:accepted-ids',
  agenda: 'agenda:current'
} as const;

/** A single person's profile (name, bio, avatar). */
export const cacheTagForPerson = (id: string) => `profile:${id}`;

/** The list of presentations shown on a presenter's page. */
export const cacheTagForPresenterPresentations = (id: string) =>
  `presenter-presentations:${id}`;

/** A single presentation's public content (title, abstract, schedule). */
export const cacheTagForPresentation = (id: string) => `presentation:${id}`;

/** A single presentation's video link. */
export const cacheTagForPresentationVideo = (id: string) =>
  `presentation-video:${id}`;

/** The full list of presentations for a given year. */
export const cacheTagForYear = (year: SummitYear) => `presentations:${year}`;
