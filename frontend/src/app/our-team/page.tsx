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
      firstName: 'Quentin',
      lastName: 'Alldredge',
      description: descriptions.QuentinAlldredge,
      image: Image_QA
    },
    {
      firstName: 'Christian',
      lastName: 'Butcher',
      description: descriptions.ChristianButcher,
      image: Image_CB
    },
    {
      firstName: 'Sam',
      lastName: 'Taggart',
      description: descriptions.SamTaggart,
      image: Image_ST
    }
  ];

  const pastOrganizers = [
    {
      firstName: 'Amanda',
      lastName: 'Bacala',
      description: descriptions.AmandaBacala,
      image: Image_AB
    },
    {
      firstName: 'Fabiola',
      lastName: 'de la Cueva',
      description: '',
      image: ''
    },
    {
      firstName: 'Piotr',
      lastName: 'Demski',
      description: '',
      image: ''
    },
    {
      firstName: 'Martin',
      lastName: 'Lentz',
      description: descriptions.MartinLentz,
      image: Image_ML
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
      firstName: 'Chris',
      lastName: 'Stryker',
      description: '',
      image: ''
    },
    {
      firstName: 'Oliver',
      lastName: 'Wachno',
      description: descriptions.OliverWachno,
      image: Image_OW
    },
    {
      firstName: 'Sarah',
      lastName: 'Zalusky',
      description: '',
      image: ''
    }
  ];

  return (
    <div className='prose flex max-w-none flex-col'>
      {/* <div>
        <h2>The GLA Summit</h2>
        <p>Description here</p>
      </div> */}
      <div className='flex max-w-none flex-col space-y-2'>
        <h2>Current Organizers</h2>
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
      {/* <div className='flex max-w-none flex-col space-y-2'> */}
      <div className='flex flex-col items-center'>
        <h2>Past Organizers</h2>
        <div className='flex flex-row flex-wrap justify-center space-x-4'>
          {pastOrganizers.map((p, idx) => {
            return (
              <span
                className='whitespace-nowrap text-lg font-semibold'
                key={idx}
              >
                {[p.firstName, p.lastName].join(' ')}
              </span>
            );
            // return (
            //   <div className='border p-4 shadow-sm' key={idx}>
            //     <PersonDisplay
            //       {...p}
            //       stripContainer
            //       imageSide={idx % 2 === 0 ? 'right' : 'left'}
            //     />
            //   </div>
            // );
          })}
        </div>
      </div>
    </div>
  );
};

export default OurTeam;
