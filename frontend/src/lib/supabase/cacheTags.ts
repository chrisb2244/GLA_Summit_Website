export const CACHE_TAGS = {
  acceptedPresenterIds: 'presenters:accepted-ids',
  people: 'profiles:people'
} as const;

export const cacheTagForPerson = (id: string) => `profile:${id}`;
