import { createEvent } from 'ics';
import type { EventAttributes } from 'ics';
import { ticketYear, startDate, eventUrl } from '@/app/configConstants';
import { dateToDateArray } from '@/lib/utils';

export async function GET() {
  const start = dateToDateArray(startDate);

  const abstract = `Join us for the GLA Summit - a Global LabVIEW and Automated Test conference.`;

  const eventAttributes: EventAttributes = {
    start,
    startInputType: 'utc',
    duration: { minutes: 24 * 60 },
    title: `GLA Summit ${ticketYear}`,
    description: abstract,
    url: eventUrl,
    location: eventUrl
  };

  const { error: eventError, value } = createEvent(eventAttributes);
  if (eventError || typeof value === 'undefined') {
    return Response.json('Unable to generate the requested ICS file', {
      status: 500
    });
  }

  const safeTitle = `glasummit-${ticketYear}`.replaceAll(/[^a-zA-Z0-9 ]/g, '');

  const res = new Response(value);
  res.headers.set('Content-Type', 'text/calendar');
  res.headers.set(
    'Content-Disposition',
    'attachment; filename=' + safeTitle + '.ics'
  );
  return res;
}
