import { Organizer } from '../Components/Organizer'
import { Grid } from '@mui/material'
import { descriptions } from '../organizer-descriptions'
import Image_OW from '@/media/OliWachno.jpg'
import Image_TM from '@/media/TomMcQuillan.png'
// import Image_CB from '@/media/ChristianButcher.png'
import Image_SS from '@/media/SreejithSreenivasan.jpg'
import Image_ST from '@/media/SamTaggart.jpg'
import Image_WR from '@/media/WilliamRichards.jpg'
import Image_MR from '@/media/MichalRadziwon.jpg'

const OurTeam: React.FC = () => {
  return (
    <Grid container>
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
        // image={Image_CB}
        image={Image_TM}
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
    </Grid>
  )
}

export default OurTeam
