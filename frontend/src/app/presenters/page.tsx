import { PersonDisplay } from '@/Components/PersonDisplay';
import { getPeople } from '@/lib/databaseFunctions';
import { createAnonServerClient } from '@/lib/supabaseClient';
import { Route } from 'next';

const PresentersListPage = async () => {
  const supabase = createAnonServerClient();
  const nameSorter = (a: string, b: string) => a.localeCompare(b);

  const { data, error } = await supabase
    .from('accepted_presentations')
    .select('presentation_submissions(presentation_presenters(presenter_id))');

  if (error) {
    return <p>Sorry - the list of presenters could not be found!</p>;
  }

  const presentersList = data.flatMap((listOfSubmissions) => {
    const listOfPresenters =
      listOfSubmissions.presentation_submissions?.presentation_presenters ?? [];
    return listOfPresenters.map((p) => p.presenter_id);
  });
  const uniquePresentersList = Array.from(new Set(presentersList));

  const people = await getPeople(uniquePresentersList).then((personArray) => {
    return personArray.sort((a, b) => nameSorter(a.lastName, b.lastName));
  });

  const presenterElements = people.map(({ id, ...person }) => {
    return (
      <PersonDisplay
        key={id}
        {...person}
        pageLink={`/presenters/${id}` as Route}
        useDefaultIconImage
      />
    );
  });

  return <div className='flex flex-col space-y-2'>{presenterElements}</div>;
};

export default PresentersListPage;
