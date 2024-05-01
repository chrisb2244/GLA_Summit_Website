import { PersonDisplay } from '@/Components/PersonDisplay';
import { getAcceptedPresenterIds, getPeople } from '@/lib/supabase/public';
import { Route } from 'next';

const PresentersListPage = async () => {
  const nameSorter = (a: string, b: string) => a.localeCompare(b);

  const uniquePresentersList = await getAcceptedPresenterIds();

  const people = await getPeople(uniquePresentersList).then((personArray) => {
    return personArray.sort((a, b) => nameSorter(a.lastName, b.lastName));
  });

  const presenterElements = people.map(({ id, ...person }) => {
    return (
      <div className='border p-4 shadow-sm [&_p]:line-clamp-6' key={id}>
        <PersonDisplay
          {...person}
          pageLink={`/presenters/${id}` as Route}
          useDefaultIconImage
          stripContainer
        />
      </div>
    );
  });

  return (
    <div className='prose flex max-w-none flex-col space-y-2'>
      {presenterElements}
    </div>
  );
};

export default PresentersListPage;
