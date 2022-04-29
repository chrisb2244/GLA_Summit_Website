import { Organizer } from '../Components/Organizer'
import { descriptions } from '../organizer-descriptions'
import Image_OW from '@/media/OliWachno.jpg'
import Image_TM from '@/media/TomMcQuillan.png'
import Image_CB from '@/media/ChristianButcher.jpg'
import Image_SS from '@/media/SreejithSreenivasan.jpg'
import Image_ST from '@/media/SamTaggart.jpg'
import Image_WR from '@/media/WilliamRichards.jpg'
import Image_MR from '@/media/MichalRadziwon.jpg'
import Image_AB from '@/media/AmandaBacala.webp'
import Image_ML from '@/media/MartinLentz.jpg'
import Image_QA from '@/media/QuentinAlldredge.png'
import { StackedBoxes } from '@/Components/Layout/StackedBoxes'

const OurTeam: React.FC = () => {
  return (
    <StackedBoxes>
      <Organizer
        firstName='Oliver'
        lastName='Wachno'
        description={descriptions.OliverWachno}
        image={Image_OW}
        imageSide='left'
      />
      <Organizer
        firstName='Christian'
        lastName='Butcher'
        description={descriptions.ChristianButcher}
        image={Image_CB}
      />
      <Organizer
        firstName='Tom'
        lastName='McQuillan'
        description={descriptions.TomMcQuillan}
        image={Image_TM}
        imageSide='left'
      />
      <Organizer
        firstName='Sreejith'
        lastName='Sreenivasan'
        description={descriptions.SreejithSreenivasan}
        image={Image_SS}
      />
      <Organizer
        firstName='Sam'
        lastName='Taggart'
        description={descriptions.SamTaggart}
        image={Image_ST}
        imageSide='left'
      />
      <Organizer
        firstName='William'
        lastName='Richards'
        description={descriptions.WilliamRichards}
        image={Image_WR}
      />
      <Organizer
        firstName='Michał'
        lastName='Radziwon'
        description={descriptions.MichalRadziwon}
        image={Image_MR}
        imageSide='left'
      />
      <Organizer
        firstName='Amanda'
        lastName='Bacala'
        description={descriptions.AmandaBacala}
        image={Image_AB}
      />
      <Organizer
        firstName='Martin'
        lastName='Lentz'
        description={descriptions.MartinLentz}
        image={Image_ML}
        imageSide='left'
        imagePosition='70% 50%'
      />
      <Organizer
        firstName='Quentin'
        lastName='Alldredge'
        description={descriptions.QuentinAlldredge}
        image={Image_QA}
      />
    </StackedBoxes>
  )
}

export default OurTeam
