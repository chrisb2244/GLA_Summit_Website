import FB_Attendee from '@/media/banners/attendee-fb-2026.png';
import IN_Attendee from '@/media/banners/attendee-in-2026.png';
import LI_Attendee from '@/media/banners/attendee-li-2026.png';
import TW_Attendee from '@/media/banners/attendee-tw-2026.png';
import FB_Speaker from '@/media/banners/speaker-fb-2026.png';
import IN_Speaker from '@/media/banners/speaker-in-2026.png';
import LI_Speaker from '@/media/banners/speaker-li-2026.png';
import TW_Speaker from '@/media/banners/speaker-tw-2026.png';
import JKI_Logo from '@/media/JKI-Logo.webp';
import NextImage, { StaticImageData } from 'next/image';
import { estimateAspectRatio } from '@/lib/utils';
import { MEDIA_BANNERS_AVAILABLE } from '@/app/configConstants';
import { CopyableTextBox } from '@/Components/Utilities/CopyableTextBox';
import glaLogo from '../../../public/logo.png';

const MediaPage = () => {
  const hostname =
    typeof window !== 'undefined'
      ? window.location.protocol + '//' + window.location.host
      : '';

  type ImageList = {
    label: string;
    attendeeImg: StaticImageData;
    speakerImg: StaticImageData;
  }[];
  const images: ImageList = [
    { label: 'Facebook', attendeeImg: FB_Attendee, speakerImg: FB_Speaker },
    { label: 'Instagram', attendeeImg: IN_Attendee, speakerImg: IN_Speaker },
    { label: 'LinkedIn', attendeeImg: LI_Attendee, speakerImg: LI_Speaker },
    { label: 'Twitter', attendeeImg: TW_Attendee, speakerImg: TW_Speaker }
  ];

  const buildImageTableRows = (
    imageList: ImageList,
    listType: 'Attendee' | 'Speaker'
  ) => {
    return imageList.map((elem) => {
      const img = listType === 'Attendee' ? elem.attendeeImg : elem.speakerImg;
      const url = hostname + img.src;
      const closeAspectRatio = estimateAspectRatio(img.width, img.height);
      const sizeInfo = `(${closeAspectRatio}, ${img.width}x${img.height}px)`;
      const key = `bannerimage-link-${listType.toLowerCase()}-${elem.label}`;
      return (
        <tr key={key} className='prose'>
          <td>
            <a href={url}>{`${listType} - ${elem.label}`}</a>
          </td>
          <td>
            <span className='break-spaces sm:whitespace-nowrap'>{`${sizeInfo}`}</span>
          </td>
        </tr>
      );
    });
  };

  const bannerImagesAttendee = buildImageTableRows(images, 'Attendee');
  const bannerImagesSpeaker = buildImageTableRows(images, 'Speaker');

  // The forum-signature HTML is copied out and pasted on an external site
  // (the NI Community forums), so it must use a fixed, absolute, canonical URL
  // rather than the runtime `hostname` the banner links use above (which is
  // empty during SSR and localhost in development).
  const SITE_ORIGIN = 'https://www.glasummit.org';
  const signatureImgUrl = `${SITE_ORIGIN}/logo.png`;
  const signatureHtml = `<a href="${SITE_ORIGIN}"><img src="${signatureImgUrl}" height="100" width="100" alt="I'm attending the GLA Summit!"></a>`;

  return (
    <div className='mt-4 flex flex-col space-y-4 px-6 md:mx-auto md:max-w-4xl'>
      {MEDIA_BANNERS_AVAILABLE ? (
        <>
          {/* The JKI logo and thank-you blurb are included as part of the media */}
          <div className='flex flex-col items-center px-8 max-sm:space-y-2 sm:flex-row sm:space-x-6'>
            <a href='https://jki.net'>
              <NextImage
                src={JKI_Logo}
                alt='JKI logo'
                className='h-auto max-h-[380px] w-auto min-w-[190px]'
                sizes='(max-width: 600px) 100vw, 50vw'
              />
            </a>
            <p className='prose mx-2 w-full max-w-none flex-grow'>
              The GLA Summit Organizers would like to thank JKI for providing us
              with the images and banners available below, along with other
              graphics support.
            </p>
          </div>
          {/* Usage suggestions */}
          <p className='prose mx-2 max-w-none text-center'>
            Please feel free to use the images on this page on your social media
            or website (including your NI forum signature). Links to the images
            can be found in the &lsquo;href&rsquo; attributes of the HTML
            samples, or by right-clicking and choosing an option like
            &ldquo;Copy link address&rdquo;.
          </p>
          {/* Forum copyable link */}
          <h3 className='text-3xl'>Forum Signature</h3>
          <p className='prose mx-2 max-w-none'>
            To adjust your NI Community forum signature, go to your community
            account &ldquo;My Profile&rdquo; settings, then Personal &gt;
            Personal Information, and paste the HTML below. It renders as a
            small GLA Summit logo linking back to the event site.
          </p>
          <div className='space-4 flex flex-col sm:flex-row'>
            <NextImage
              src={glaLogo}
              alt='GLA Summit logo'
              className='sm:mx-6 h-24 w-24 align-middle my-6 sm:my-auto mx-auto'
            />
            <CopyableTextBox copyString={signatureHtml}>
              <div className='bg-gray-200 p-6'>
                <code className='font-mono max-xl:break-all'>
                  {signatureHtml}
                </code>
              </div>
            </CopyableTextBox>
          </div>

          {/* Attendee links and example banner */}
          <h3 className='text-3xl'>Attendees</h3>
          <table className='w-min [&_td]:whitespace-nowrap [&_td]:border-none [&_td]:px-4 [&_td]:py-0'>
            <tbody>{bannerImagesAttendee}</tbody>
          </table>
          <NextImage
            key='bannerimage-attendee'
            alt='attendee banner'
            src={TW_Attendee}
            className='mx-auto'
          />
          {/* Speaker links and example banner */}
          <h3 className='text-3xl'>Speakers</h3>
          <table className='w-min [&_td]:whitespace-nowrap [&_td]:border-none [&_td]:px-4 [&_td]:py-0'>
            <tbody>{bannerImagesSpeaker}</tbody>
          </table>
          <NextImage
            key='bannerimage-speaker'
            alt='speaker banner'
            src={TW_Speaker}
            className='mx-auto'
          />
        </>
      ) : (
        <div className='prose max-w-2xl text-center'>
          <p>
            The GLA Summit Organizers are currently updating the banners for the
            2026 event.
          </p>
          <p>We look forward to sharing the new banners with you soon.</p>
        </div>
      )}
    </div>
  );
};

export default MediaPage;
