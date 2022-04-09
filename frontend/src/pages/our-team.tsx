import { Organizer } from '../Components/Organizer'
import { Grid } from '@mui/material'
import Image_TM from '@/media/TomMcQuillan.png'
import { descriptions } from '../organizer-descriptions'

const OurTeam: React.FC = () => {
  return (
    <Grid container>
      <Organizer
        firstName='Oliver'
        lastName='Wachno'
        description={descriptions.OliverWachno}
      />
      <Organizer
        firstName='Christian'
        lastName='Butcher'
        description={descriptions.ChristianButcher}
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
      />
      <Organizer
        firstName='Sam'
        lastName='Taggart'
        description={descriptions.SamTaggart}
      />
      <Organizer
        firstName='William'
        lastName='Richards'
        description={descriptions.WilliamRichards}
      />
      <Organizer
        firstName='Michał'
        lastName='Radziwon'
        description={descriptions.MichalRadziwon}
      />
    </Grid>
  )
}

export default OurTeam
