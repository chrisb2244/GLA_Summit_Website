import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { SponsorBar } from './_rootElements/SponsorBar'
import React, { ReactNode } from 'react'
// import { Countdown } from './_rootElements/Countdown'

export default function Page() {
  const P = (
    props: { children?: ReactNode } & React.HTMLAttributes<HTMLParagraphElement>
  ) => {
    const { className: classNameProps, ...other } = props
    return (
      <p className={`prose max-w-none text-center ${classNameProps ?? ''}`} {...other}>
        {props.children}
      </p>
    )
  }

  // The month value is 0-based (so 10 -> November)
  // const eventStart = new Date(Date.UTC(2022, 10, 14, 12, 0, 0))
  // const eventEnd = new Date(Date.UTC(2022, 10, 15, 12, 0, 0))
  // const countdown = false ? (
  //   <Countdown event_start={eventStart} event_end={eventEnd} />
  // ) : (
  //   <>
  //     <P mb={3}>
  //       This event has finished - please give us your feedback by filling out
  //       our <a href='https://ahaslides.com/GLA22POLL'>poll</a>!
  //     </P>
  //     <P>
  //       For recertification points, please complete{' '}
  //       <a href='https://ahaslides.com/GLA22CERT'>this form</a>. We will share
  //       the information submitted via this form with NI.
  //     </P>
  //   </>
  // )

  // const registrationButton = false ? (
  //   <Box>
  //     <Link href={'https://hopin.com/events/gla-summit-2022'}>
  //       <Button fullWidth variant='contained' className='bg-primaryc'>
  //         Register for a ticket at Hopin
  //       </Button>
  //     </Link>
  //   </Box>
  // ) : null


  return (
    <div>
      <StackedBoxes>
        <P>
          The GLA Summit Organizers would like to thank all of the LabVIEW
          enthusiasts who joined us for our third GLA Summit!
        </P>
        <P>
          We were excited to welcome advanced LabVIEW developers and Architects
          (certified or self-proclaimed) from around the world to network and
          participate in an inclusive, all-digital, free event.
        </P>
        <P>
          Recordings of all of the presentations will be made available via the{' '}
          <a
            href='https://www.youtube.com/c/GlobalLabVIEWArchitects'
            className='underline'
          >
            GLA Summit YouTube channel
          </a>{' '}
          - we hope that you are as excited as we are to see any presentations
          you missed, or to rewatch for details!
        </P>
      </StackedBoxes>
      <SponsorBar />
    </div>
  )
}
