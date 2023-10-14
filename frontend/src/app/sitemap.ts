import { getPeople, getPresenterIds } from '@/lib/databaseFunctions';
import { createAnonServerClient } from '@/lib/supabaseClient';
import { MetadataRoute } from 'next';

type Frequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

type Entry = {
  url: string;
  lastModified?: string | Date | undefined;
  changeFrequency?: Frequency;
  priority?: number | undefined;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrlInitial = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (typeof baseUrlInitial !== 'string') {
    // Give up generating an accurate sitemap
    // NEXT_PUBLIC_VERCEL_URL should be defined in .env.local for local testing
    return [];
  }
  const detectedBaseUrl = baseUrlInitial.startsWith('http')
    ? baseUrlInitial
    : `https://${baseUrlInitial}`;

  const deploymentType = process.env.NEXT_PUBLIC_VERCEL_ENV as
    | 'production'
    | 'preview'
    | 'development'
    | undefined;
  const baseUrl =
    deploymentType === 'production' ? 'https://www.glasummit.org' : detectedBaseUrl;

  /* 
    / - homepage (weekly)
    /{access-denied,api,logs,media,my-presentations,my-profile,review-submissions,validateLogin} - don't add these, add noindex to them
    /full-agenda (monthly)
    /our-team (yearly)
    /panels (monthly)
    /presentation-list/[year] (monthly/never (by year))
    /presenters (monthly)
  */
  const generateEntry = (relUrl: string, frequency?: Frequency): Entry => {
    return {
      url: baseUrl + relUrl,
      changeFrequency: frequency
    };
  };

  const staticEntries: Entry[] = [
    generateEntry('/', 'weekly'),
    generateEntry('/full-agenda', 'monthly'),
    generateEntry('/out-team', 'yearly'),
    generateEntry('/panels/labview-and-python', 'never'),
    generateEntry('/panels/open-source', 'never'),
    generateEntry('/presentation-list/2021', 'never'),
    generateEntry('/presentation-list/2022', 'never'),
    // generateEntry('/presentation-list/2024', 'monthly'),
    generateEntry('/presenters', 'monthly')
  ];

  /*
    /presentations/[id] (never, but pass lastModified)
    /presenters/[id] (monthly, pass updated_at)
  */
  const supabase = createAnonServerClient();
  const { data: presentationData } = await supabase
    .from('accepted_presentations')
    .select('id,accepted_at');
  const presentationEntries =
    presentationData !== null
      ? presentationData.map(({ id, accepted_at }) => {
          return {
            ...generateEntry(`/presentations/${id}`, 'never'),
            lastModified: new Date(accepted_at)
          };
        })
      : [];

  const presenterIds = (await getPresenterIds()).map(({ id }) => id);
  const presenterInfo = await getPeople(presenterIds);

  const presenterEntries = presenterInfo.map(({ id, updated_at }) => {
    return {
      ...generateEntry(`/presenters/${id}`, 'monthly'),
      lastModified: new Date(updated_at)
    };
  });

  return [...staticEntries, ...presentationEntries, ...presenterEntries];
}
