import { ImageResponse } from 'next/og';
import { IMG_WIDTH, IMG_HEIGHT } from './constants';
import { ticketYear } from '@/app/configConstants';
import { Ticket } from './Ticket';
import { checkToken, paramStringToData } from '@/app/ticket/utils';
import { createAdminClient } from '@/lib/supabaseClient';
import type { NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const data = searchParams.get('data');

  if (!data) {
    return new Response('Invalid request.', { status: 400 });
  }

  const transferObject = paramStringToData(data);
  if (!transferObject) {
    return new Response('Invalid data.', { status: 400 });
  }

  if (!(await checkToken(transferObject.data, transferObject.token))) {
    return new Response('Invalid token.', { status: 401 });
  }

  const dataObj = transferObject.data;

  const robotoBoldData = await readFile(
    path.join(process.cwd(), 'public/assets/Roboto-Bold.ttf')
  ).then((buffer) => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));

  const logoData = await readFile(
    path.join(process.cwd(), 'public/assets/GLA-logo.svg')
  ).then((buffer) => `data:image/svg+xml;base64,${buffer.toString('base64')}`);

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
