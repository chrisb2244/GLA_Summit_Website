import FB_Attendee from '@/media/banners/attendee-fb-2022-01.jpg';
import IN_Attendee from '@/media/banners/attendee-in-2022-01.jpg';
import LI_Attendee from '@/media/banners/attendee-li-2022-01.jpg';
import TW_Attendee from '@/media/banners/attendee-tw-2022-01.jpg';
import FB_Speaker from '@/media/banners/speaker-fb-2022-01.jpg';
import IN_Speaker from '@/media/banners/speaker-in-2021-01.jpg';
import LI_Speaker from '@/media/banners/speaker-li-2022-01.jpg';
import TW_Speaker from '@/media/banners/speaker_twitter_2022-01.jpg';
import SignatureImage from '@/media/banners/GLASummit2022WikiBanner.png';
import JKI_Logo from '@/media/JKI-Logo.webp';
import { StackedBoxes } from '@/Components/Layout/StackedBoxes';
import NextImage, { StaticImageData } from 'next/image';

// import { CopyableTextBox } from '@/Components/CopyableTextBox'
import { estimateAspectRatio } from '@/lib/utils';
import { ReactNode } from 'react';
import { CopyableTextBox } from '@/Components/CopyableTextBox';

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
        <tr key={key} className='prose text-lg'>
          <td className='align-middle'>
            <a href={url}>{`${listType} - ${elem.label}`}</a>
          </td>
          <td>
            <span className='break-spaces max-sm:hidden sm:whitespace-nowrap'>{`${sizeInfo}`}</span>
            <div className='sm:hidden'>
              <span>
                {closeAspectRatio}
                <br />
                {`(${img.width}x${img.height}px)`}
              </span>
            </div>
          </td>
        </tr>
      );
    });
  };

  const SidewaysBox = (props: { children?: ReactNode }) => {
    return (
      <div className='flex flex-col items-center px-8 max-md:space-y-2 md:flex-row md:space-x-2'>
        {props.children}
      </div>
    );
  };

  const jkiDiv = (
    <SidewaysBox>
      <div className='sm:max-w-2/5 relative inline-block h-full max-h-[250px] flex-grow-0 max-sm:min-h-[40vw] max-sm:w-full sm:min-h-[min(15vw,200px)] sm:w-2/5'>
        <a href='https://jki.net'>
          <NextImage
            src={JKI_Logo}
            alt='JKI logo'
            fill
            className='object-contain'
          />
        </a>
      </div>
      <p className='prose mx-2 w-full max-w-none flex-grow text-xl'>
        The GLA Summit Organizers would like to thank JKI for providing us with
        the images and banners available below, along with other graphics
        support.
      </p>
    </SidewaysBox>
  );

  const signatureDiv = (
    <SidewaysBox>
      <div className='relative h-[10vw] max-h-[200px] min-h-[8vh] w-full'>
        <NextImage
          src={SignatureImage}
          alt='GLA signature image'
          fill
          className='object-contain'
        />
      </div>
      <CopyableTextBox
        copyString={`<a href="https://glasummit.org"> <img src="${
          hostname + SignatureImage.src
        }" height="100" width="300" alt="I'm attending the GLA Summit!"> </a>`}
      >
        <div className='bg-gray-200 p-6'>
          <code className='break-all font-mono'>
            &lt;a href=&quot;https://glasummit.org&quot;&gt; &lt;img src=&quot;
            {hostname + SignatureImage.src}&quot; height=&quot;100&quot;
            width=&quot;300&quot; alt=&quot;I&apos;m attending the GLA
            Summit!&quot;&gt; &lt;/a&gt;
          </code>
        </div>
      </CopyableTextBox>
    </SidewaysBox>
  );

  const bannerImagesAttendee = buildImageTableRows(images, 'Attendee');
  const bannerImagesSpeaker = buildImageTableRows(images, 'Speaker');

  return (
    <StackedBoxes>
      {jkiDiv}
      <div className='prose w-full max-w-none text-lg'>
        <p>
          Please feel free to use the images on this page on your social media
          or website (including your NI forum signature). Links to the images
          can be found in the &lsquo;href&rsquo; attributes of the HTML samples,
          or by right-clicking and choosing an option like &ldquo;Copy image
          address&rdquo;.
        </p>
        <p>
          To access your signature on the NI Community pages, go to your
          community account &ldquo;My Profile&rdquo; settings and then Personal
          &gt; Personal Information.
        </p>
        <p>
          Examples of HTML that could be copied into the signature line are
          below:
        </p>
      </div>
      {signatureDiv}

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
    </StackedBoxes>
  );
};

export default MediaPage;
