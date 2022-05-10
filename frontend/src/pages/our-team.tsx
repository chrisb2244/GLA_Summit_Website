import { PersonDisplay } from '../Components/PersonDisplay'
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
      <PersonDisplay
        firstName='Oliver'
        lastName='Wachno'
        description={descriptions.OliverWachno}
        image={Image_OW}
        imageSide='left'
      />
      <PersonDisplay
        firstName='Christian'
        lastName='Butcher'
        description={descriptions.ChristianButcher}
        image={Image_CB}
      />
      <PersonDisplay
        firstName='Tom'
        lastName='McQuillan'
        description={descriptions.TomMcQuillan}
        image={Image_TM}
        imageSide='left'
      />
      <PersonDisplay
        firstName='Sreejith'
        lastName='Sreenivasan'
        description={descriptions.SreejithSreenivasan}
        image={Image_SS}
      />
      <PersonDisplay
        firstName='Sam'
        lastName='Taggart'
        description={descriptions.SamTaggart}
        image={Image_ST}
        imageSide='left'
      />
      <PersonDisplay
        firstName='William'
        lastName='Richards'
        description={descriptions.WilliamRichards}
        image={Image_WR}
      />
      <PersonDisplay
        firstName='Michał'
        lastName='Radziwon'
        description={descriptions.MichalRadziwon}
        image={Image_MR}
        imageSide='left'
      />
      <PersonDisplay
        firstName='Amanda'
        lastName='Bacala'
        description={descriptions.AmandaBacala}
        image={Image_AB}
      />
      <PersonDisplay
        firstName='Martin'
        lastName='Lentz'
        description={descriptions.MartinLentz}
        image={Image_ML}
        imageSide='left'
        imagePosition='70% 50%'
      />
      <PersonDisplay
        firstName='Quentin'
        lastName='Alldredge'
        description={descriptions.QuentinAlldredge}
        image={Image_QA}
      />
    </StackedBoxes>
  )
}

export default OurTeam
