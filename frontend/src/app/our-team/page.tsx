import { PersonDisplay } from '@/Components/PersonDisplay';
import { descriptions } from './organizer-descriptions';
import Image_OW from '@/media/OliWachno.jpg';
import Image_TM from '@/media/TomMcQuillan.png';
import Image_CB from '@/media/ChristianButcher.jpg';
import Image_SS from '@/media/SreejithSreenivasan.jpg';
import Image_ST from '@/media/SamTaggart.jpg';
import Image_WR from '@/media/WilliamRichards.jpg';
import Image_MR from '@/media/MichalRadziwon.jpg';
import Image_AB from '@/media/AmandaBacala.webp';
import Image_ML from '@/media/MartinLentz.jpg';
import Image_QA from '@/media/QuentinAlldredge.webp';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Team'
};

const OurTeam = () => {
  const elemSrcs = [
    {
      firstName: 'Oliver',
      lastName: 'Wachno',
      description: descriptions.OliverWachno,
      image: Image_OW
    },
    {
      firstName: 'Christian',
      lastName: 'Butcher',
      description: descriptions.ChristianButcher,
      image: Image_CB
    },
    {
      firstName: 'Tom',
      lastName: 'McQuillan',
      description: descriptions.TomMcQuillan,
      image: Image_TM
    },
    {
      firstName: 'Sreejith',
      lastName: 'Sreenivasan',
      description: descriptions.SreejithSreenivasan,
      image: Image_SS
    },
    {
      firstName: 'Sam',
      lastName: 'Taggart',
      description: descriptions.SamTaggart,
      image: Image_ST
    },
    {
      firstName: 'William',
      lastName: 'Richards',
      description: descriptions.WilliamRichards,
      image: Image_WR
    },
    {
      firstName: 'Michał',
      lastName: 'Radziwon',
      description: descriptions.MichalRadziwon,
      image: Image_MR
    },
    {
      firstName: 'Amanda',
      lastName: 'Bacala',
      description: descriptions.AmandaBacala,
      image: Image_AB
    },
    {
      firstName: 'Martin',
      lastName: 'Lentz',
      description: descriptions.MartinLentz,
      image: Image_ML
    },
    {
      firstName: 'Quentin',
      lastName: 'Alldredge',
      description: descriptions.QuentinAlldredge,
      image: Image_QA
    }
  ];

  return (
    <div className='prose flex max-w-none flex-col space-y-2'>
      {elemSrcs.map((p, idx) => {
        return (
          <div className='border p-4 shadow-sm' key={idx}>
            <PersonDisplay
              {...p}
              stripContainer
              imageSide={idx % 2 === 0 ? 'right' : 'left'}
            />
          </div>
        );
      })}
    </div>
  );
};

export default OurTeam;
