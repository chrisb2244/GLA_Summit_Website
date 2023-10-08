import type { NextApiHandler } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/sb_databaseModels';
import { createEvent } from 'ics';
import type { EventAttributes, DateArray } from 'ics';
import { getSessionDurationInMinutes } from '@/lib/utils';

const dateToDateArray = (d: Date): DateArray => {
  return [
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes()
  ];
};

const handler: NextApiHandler = async (req, res) => {
  const supabase = createPagesServerClient<Database>({ req, res });
  const { presentationId } = req.query as { presentationId: string };

  // Basic sanitization - id should be a hex string with "-" characters
  if (!presentationId.match(/^[-0-9a-f]*$/)) {
    return res.status(400).json('Invalid presentation ID');
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
    return res.status(500).send('Unable to fetch the specified session');
  }

  if (data.scheduled_for === null) {
    return res
      .status(400)
      .send('The presentation specified has not been scheduled yet');
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
    return res.status(500).send('Unable to generate the requested ICS file');
  }

  const safeTitle = presentationData.title.replaceAll(/[^a-zA-Z0-9 ]/g, '');

  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=' + safeTitle + '.ics'
  );
  return res.send(value);
};

export default handler;
