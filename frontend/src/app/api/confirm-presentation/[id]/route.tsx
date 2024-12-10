import { NextParams, satisfy } from '@/lib/NextTypes';
import { createRouteHandlerClient } from '@/lib/supabaseServer';

type RouteParams = satisfy<NextParams, Promise<{ id: string }>>;

export async function GET(
  request: Request,
  { params }: { params: RouteParams }
) {
  const supabase = await createRouteHandlerClient();
  const { id } = await params;

  // Check if presentation ID matches something the logged-in user can confirm
  const user = await supabase.auth.getUser().then(({ data, error }) => {
    if (error) {
      return null;
    }
    return data.user;
  });

  if (user === null) {
    return new Response('Unauthorized', { status: 401 });
  }

  const idWasSubmittedByLoggedInPresenter = await supabase
    .from('presentation_submissions')
    .select('*')
    .eq('submitter_id', user.id)
    .eq('id', id)
    .single()
    .then(({ error }) => {
      if (error) {
        return false;
      }
      return true;
    });
  if (!idWasSubmittedByLoggedInPresenter) {
    return new Response('Unauthorized', { status: 401 });
  }

  const status = await supabase
    .from('confirmed_presentations')
    .insert({ id })
    .select()
    .single()
    .then(({ data, error }) => {
      console.log({ data, error });
      if (error && error.code !== '23505') {
        return 'ERROR';
      } else if (error && error.code === '23505') {
        // Duplicate
        return 'DUPLICATE';
      }
      return 'SUCCESS';
    });

  switch (status) {
    case 'ERROR':
      return new Response(
        'Unable to confirm your presentation timeslot. If you are the submitter (and not a copresenter) then please contact web@glasummit.org to manually confirm your timeslot (and complain about the broken website!)',
        { status: 500 }
      );
    case 'DUPLICATE':
      return new Response(
        'You have already confirmed your presentation timeslot',
        { status: 200 }
      );
    case 'SUCCESS':
      return new Response('Successfully confirmed your presentation timeslot', {
        status: 200
      });
  }
}
