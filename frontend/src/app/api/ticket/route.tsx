import { ImageResponse } from 'next/og';
import { IMG_WIDTH, IMG_HEIGHT, ticketYear } from './constants';
import { Ticket } from './Ticket';
import type { TicketData } from '@/app/ticket/[ticketObject]/page';

export const runtime = 'edge';

const TICKET_KEY = process.env.TICKET_KEY as string;
const key = crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(TICKET_KEY),
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign']
);

function toHex(buffer: ArrayBuffer) {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => x.toString(16).padStart(2, '0'))
    .join('');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const data = searchParams.get('data');

  if (!data || !token) {
    return new Response('Invalid request.', { status: 400 });
  }

  const verifyToken = toHex(
    await crypto.subtle.sign('HMAC', await key, new TextEncoder().encode(data))
  );

  if (verifyToken !== token) {
    return new Response('Invalid token.', { status: 401 });
  }

  let dataObj: TicketData;
  try {
    // Consider checking the properties match a TicketData object
    dataObj = JSON.parse(Buffer.from(data, 'base64').toString('ascii'));
  } catch (error) {
    return new Response('Invalid data.', { status: 400 });
  }

  const robotoBoldData = await fetch(
    new URL('public/assets/Roboto-Bold.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

  const logoData = await fetch(
    new URL('public/assets/GLA-logo.svg', import.meta.url)
  )
    .then((res) => res.arrayBuffer())
    .then((buffer) => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = buffer.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    })
    .then((b64) => `data:image/svg+xml;base64,${b64}`);

  const isPresenter = dataObj.isPresenter;
  const titles = isPresenter ? await getTitles(dataObj.userId) : null;

  return new ImageResponse(
    (
      <Ticket
        firstName={dataObj.firstName}
        lastName={dataObj.lastName}
        isPresenter={dataObj.isPresenter}
        titles={titles}
        ticketNumber={dataObj.ticketNumber}
        logoData={logoData}
      />
    ),
    {
      width: IMG_WIDTH,
      height: IMG_HEIGHT,
      fonts: [
        {
          data: robotoBoldData,
          name: 'Roboto-Bold',
          weight: 700,
          style: 'normal'
        }
      ]
    }
  );
}

const getTitles = async (userId: string) => {
  const { createAdminClient } = await import('@/lib/supabaseClient');
  const supabase = createAdminClient();
  const titles = await supabase
    .from('presentation_submissions')
    .select(
      'title, presentation_presenters!inner(presenter_id), accepted_presentations!inner(year)'
    )
    .eq('accepted_presentations.year', ticketYear)
    .in('presentation_presenters.presenter_id', [userId])
    .then(({ data, error }) => {
      if (error) {
        console.error(error);
        return null;
      }
      if (data.length > 0) {
        return data.map((d) => d.title);
      }
      return null;
    });

  return titles;
};
