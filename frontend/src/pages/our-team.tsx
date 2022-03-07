import { Organizer } from '../Components/Organizer'
import { Grid } from '@mui/material'

const OurTeam: React.FC = (props) => {
  return (
    <Grid container>
      <Organizer firstName='Chris' lastName='Stryker' description={descriptionChrisStryker} image='ChrisStryker.png' />
      <Organizer firstName='Christian' lastName='Butcher' description='Another person' />
      <Organizer firstName='Tom' lastName='McQuillan' description={descriptionTomMcQuillan} image='TomMcQuillan.png' imageSide='left' />
    </Grid>
  )
}

export default OurTeam

const descriptionChrisStryker = (
  <>
    <p>Coming from a C++ background, Christopher first encountered LabVIEW in one of his college Mechanical Engineering courses. He was not amused, to say the least... it was clearly a tool for lazy people who didn't know how to program. Fortunately, his instructor forced him to use it.</p>
    <p>Christopher is now a staunch advocate for LabVIEW, having spent time with NI (eventually ending up in LabVIEW R&D) and now with Hiller Measurements. At Hiller, he is a Software Engineer III and Functional Training Lead. He is also a Certified LabVIEW Architect and LabVIEW Champion.</p>
    <p>Talk to Christopher about CI/CD, object-oriented programming, clean code, and how to help grow and strengthen the LabVIEW community as a whole. Keep an eye out for his blog posts at https://www.hillermeas.com/blog.</p>
    <p>He lives outside Austin, TX and in his free time enjoys spending time with his wife and daughter, photography, motorsports, and listening to or playing music.`</p>
  </>
)

const descriptionTomMcQuillan = (
  <>
    <p>I'm a software developer at Scientifica who focuses on improving software within the neuroscience research industry.</p>
    <p>I run a LabVIEW YouTube channel (Tom’s LabVIEW Adventure) and regularly teach all of the LabVIEW and TestStand training courses as a Certified Professional Instructor.</p>
    <p>Prior to working at Scientifica, I spent two years working at National Instruments, where I supported hundreds of unique applications to solve engineering challenges, and qualified as a Certified LabVIEW Architect. Before working at National Instruments I also worked for two NI alliance partners where I developed custom software and designed automated test equipment.</p>
    <p>I'm the co-chair of the European CLA Summit, and I'm on the committee for GDevCon.</p>
  </>
)
