import NI_Logo from '@/media/NI-Logo.png';
// import GCentral_Logo from '@/media/GCentral-logo-color.svg';
// import SAS_Logo from '@/media/SAS-Logo.png';
// import CorgiBytes_Logo from '@/media/corgibytes-logo.png';
// import HeartWare_Dev_Logo from '@/media/heartware-dev-logo.png'; // #1e143e_bg
import Quimby_Logo from 'public/assets/sponsors/Quimby_sticker.png';
import Newton_Logo from 'public/assets/sponsors/newtondynamics.svg';

import Link from 'next/link';
import NextImage, { type StaticImageData } from 'next/image';

export const SponsorBar: React.FC<React.PropsWithChildren<unknown>> = () => {
  type Supporter = {
    title: string;
    href: string;
    src: string | StaticImageData;
    width: number;
    height: number;
    imgWrapperCName?: string;
  };

  const supporters: Array<Supporter> = [
    {
      title: 'Newton Dynamics',
      src: Newton_Logo,
      href: 'https://www.newtondynamics.net/',
      width: 71.75,
      height: 56.1,
      imgWrapperCName: 'bg-[#000] p-2 rounded-md'
    },
    {
      title: 'Quimby App',
      src: Quimby_Logo,
      href: 'https://www.quimbyapp.com/home',
      width: 1386,
      height: 484
    }

    // {
    //   title: 'GCentral',
    //   src: GCentral_Logo,
    //   href: 'https://www.gcentral.org/',
    //   width: 120,
    //   height: 120
    // },
    // {
    //   title: 'CorgiBytes',
    //   src: CorgiBytes_Logo,
    //   href: 'https://corgibytes.com/',
    //   width: 275,
    //   height: 79
    // },
    // {
    //   title: 'HeartWare',
    //   src: HeartWare_Dev_Logo,
    //   href: 'https://www.heartware.dev/',
    //   width: 1000,
    //   height: 250,
    //   imgWrapperCName: 'bg-[#1e143e]'
    // },
    // {
    //   title: 'SAS Workshops',
    //   src: SAS_Logo,
    //   href: 'https://www.sasworkshops.com/',
    //   width: 100,
    //   height: 100
    // }
  ];

  const supporterElements = supporters.map((s) => {
    return (
      <div
        className='mx-auto flex flex-col items-center rounded-md border border-gray-300 p-2'
        key={`${s.title}-container`}
      >
        <h5 className='text-lg'>{s.title}</h5>
        <a href={s.href}>
          <div
            className={`max-h-[100px] ${
              s.imgWrapperCName ?? ''
            } relative flex items-center justify-center`}
          >
            <NextImage
              src={s.src}
              width={(s.width / s.height) * 100}
              height={100}
              className='object-scale-down'
              alt={`${s.title} Logo`}
            />
          </div>
        </a>
      </div>
    );
  });

  return (
    <div className='flex flex-col items-center justify-center'>
      <div className='my-2 rounded-lg border border-gray-300 px-12'>
        <Link href='https://www.ni.com'>
          <div className='flex w-fit items-center justify-center xs:flex-col-reverse md:flex-row'>
            <NextImage src={NI_Logo} width={180} height={180} alt='NI Logo' />
            <h5 className='px-4 text-xl'>Sponsored by NI</h5>
          </div>
        </Link>
      </div>

      <div className='mx-8 mb-4 mt-2 flex flex-col items-center justify-center pb-12'>
        <h5>Supported by:</h5>
        <div className='flex flex-col space-y-4 pt-4 md:flex-row md:space-x-4 md:space-y-0'>
          {supporterElements}
        </div>
      </div>
    </div>
  );
};
