import { createEvent } from 'ics';
import type { EventAttributes, DateArray } from 'ics';
import { ticketYear } from '../ticket/constants';

const dateToDateArray = (d: Date): DateArray => {
  return [
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes()
  ];
};

export async function GET() {
  const startDate = new Date(2024, 2, 25, 12, 0, 0);

  const start = dateToDateArray(startDate);

  const abstract = `Join us for the GLA Summit - a Global LabVIEW and Automated Test conference.`;
  // presentationData.abstract.replaceAll('\r\n', '\\n');

  const hopinUrl = 'https://hopin.com/events/gla-summit-2022';
  const eventAttributes: EventAttributes = {
    start,
    startInputType: 'utc',
    duration: { minutes: 24 * 60 },
    title: `GLA Summit ${ticketYear}`,
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

  const safeTitle = `glasummit-${ticketYear}`.replaceAll(/[^a-zA-Z0-9 ]/g, '');

  const res = new Response(value);
  res.headers.set('Content-Type', 'text/calendar');
  res.headers.set(
    'Content-Disposition',
    'attachment; filename=' + safeTitle + '.ics'
  );
  return res;
}
