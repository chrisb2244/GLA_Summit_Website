import { createEvent } from 'ics';
import type { EventAttributes, DateArray } from 'ics';
import { getSessionDurationInMinutes } from '@/lib/utils';
import { createRouteHandlerClient } from '@/lib/supabaseServer';

const dateToDateArray = (d: Date): DateArray => {
  return [
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes()
  ];
};

export async function GET(
  request: Request,
  { params }: { params: { presentationId: string } }
) {
  const { presentationId } = params;
  const supabase = createRouteHandlerClient();

  // Basic sanitization - id should be a hex string with "-" characters
  if (!presentationId.match(/^[-0-9a-f]*$/)) {
    return Response.json('Invalid presentation ID', { status: 400 });
  }
  // Consider filter by length?
  // "192c0a77-fddf-4ef9-8b9b-7e25d0c5e0bc" is valid,
  // and they have the same length in each case (at least so far...)

  const { data, error } = await supabase
    .from('accepted_presentations')
    .select(
      'scheduled_for, presentation_submissions(title, abstract, presentation_type)'
    )
    .eq('id', presentationId)
    .single();

  if (error || data.presentation_submissions === null) {
    return Response.json('Unable to fetch the specified session', {
      status: 500
    });
  }

  if (data.scheduled_for === null) {
    return Response.json(
      'The presentation specified has not been scheduled yet',
      { status: 400 }
    );
  }

  // Shouldn't be an array, but parse for TypeScript
  const presentationData = Array.isArray(data.presentation_submissions)
    ? data.presentation_submissions[0]
    : data.presentation_submissions;

  const start = dateToDateArray(new Date(data.scheduled_for));
  const duration = getSessionDurationInMinutes(
    presentationData.presentation_type
  );
  const abstract = presentationData.abstract.replaceAll('\r\n', '\\n');

  const hopinUrl = 'https://hopin.com/events/gla-summit-2022';
  const eventAttributes: EventAttributes = {
    start,
    startInputType: 'utc',
    duration: { minutes: duration },
    title: presentationData.title,
    description: abstract,
    url: hopinUrl,
    location: hopinUrl
  };

  const { error: eventError, value } = createEvent(eventAttributes);
  if (eventError || typeof value === 'undefined') {
    return Response.json('Unable to generate the requested ICS file', {
      status: 500
    });
  }

  const safeTitle = presentationData.title.replaceAll(/[^a-zA-Z0-9 ]/g, '');

  const res = new Response(value);
  res.headers.set('Content-Type', 'text/calendar');
  res.headers.set(
    'Content-Disposition',
    'attachment; filename=' + safeTitle + '.ics'
  );
  return res;
}
