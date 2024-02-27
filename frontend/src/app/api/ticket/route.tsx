import { ImageResponse } from 'next/og';

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

  const id = searchParams.get('id');
  const token = searchParams.get('token');

  const verifyToken = toHex(
    await crypto.subtle.sign(
      'HMAC',
      await key,
      new TextEncoder().encode(JSON.stringify({ id }))
    )
  );

  if (verifyToken !== token) {
    //return new Response('Invalid token.', { status: 401 });
    console.log('Invalid token.');
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

  const ticketNumber = '0001';

  // [#5837b9]
  // [#a25bcd]
  // bg-[#a25bcd]

  return new ImageResponse(
    (
      <div
        tw='flex flex-row  text-white font-black text-2xl w-full h-full'
        style={{
          backgroundColor: '#5837b9',
          fillOpacity: 0.7,
          backgroundImage: 'radial-gradient(#5837b9, #a25bcd)'
        }}
      >
        {/* Left side, text and user data */}
        <div tw='flex flex-col px-8 justify-between py-20 pl-16'>
          <div tw='flex flex-col w-full items-center pt-8'>
            <h2 tw='my-1'>I'M ATTENDING THE</h2>
            <h1 tw='my-1'>GLA SUMMIT 2024</h1>
            <div tw='border-2 border-white w-full h-0.5 my-2' />
            <h4 tw='my-0'>A Global LabVIEW and Automated Test Conference</h4>
          </div>
          <div tw='flex flex-col justify-between items-center pb-8'>
            <h2 tw='my-1'>Christian Butcher</h2>
            <h3 tw='my-1'>Ticket {ticketNumber}</h3>
          </div>
        </div>

        {/* Right side, image and date */}
        <div tw='flex flex-col w-1/3 mx-auto items-center justify-center'>
          <div tw='flex w-[320px] h-[320px]'>
            <img
              width={320}
              height={320}
              alt='GLA Summit Logo'
              src={logoData}
            />
          </div>
          <div tw='flex flex-col items-center justify-center mx-auto pt-8'>
            <p tw='my-0'>March 25th and 26th</p>
            <p tw='my-0'>12:00 UTC for 24 hours</p>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
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
