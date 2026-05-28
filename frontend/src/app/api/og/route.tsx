import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ticketYear, startDate } from '@/app/configConstants';
import type { NextRequest } from 'next/server';

const IMG_WIDTH = 1200;
const IMG_HEIGHT = 630;

export async function GET(_request: NextRequest) {
  const robotoBoldData = await readFile(
    path.join(process.cwd(), 'public/assets/Roboto-Bold.ttf')
  ).then((buf) =>
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  );

  const logoData = await readFile(
    path.join(process.cwd(), 'public/assets/GLA-logo.svg')
  ).then((buf) => `data:image/svg+xml;base64,${buf.toString('base64')}`);

  const dateString = startDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });

  return new ImageResponse(
    (
      <div
        tw='flex flex-row w-full h-full text-white'
        style={{
          backgroundImage: 'linear-gradient(90deg, #5837b9, #a25bcd)',
          fontFamily: 'Roboto-Bold'
        }}
      >
        <div tw='flex flex-col justify-center pl-16 pr-8 w-2/3'>
          <div tw='text-3xl mb-2'>
            A Global LabVIEW and Automated Test Conference
          </div>
          <div tw='text-6xl font-black mb-4'>{`GLA Summit ${ticketYear}`}</div>
          <div tw='text-2xl'>{`${dateString} · 12:00 UTC · 24 hours · Free`}</div>
          <div tw='text-xl mt-4' style={{ opacity: 0.8 }}>
            glasummit.org
          </div>
        </div>
        <div tw='flex flex-col items-center justify-center w-1/3'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img width={280} height={280} alt='GLA Summit Logo' src={logoData} />
        </div>
      </div>
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
