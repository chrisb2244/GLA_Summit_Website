import { StackedBoxes } from '@/Components/Layout/StackedBoxes';
import { SponsorBar } from './_rootElements/SponsorBar';
import React, { ReactNode } from 'react';
// import { Countdown } from './_rootElements/Countdown'

export default function Page() {
  const P = (
    props: { children?: ReactNode } & React.HTMLAttributes<HTMLParagraphElement>
  ) => {
    const { className: classNameProps, ...other } = props;
    return (
      <p className={`prose text-justify ${classNameProps ?? ''}`} {...other}>
        {props.children}
      </p>
    );
  };

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
    <div className='mx-auto'>
      <StackedBoxes>
        <P>
          The GLA Summit Organizers are excited to announce the next GLA Summit,
          scheduled for 25-26 March 2024!
        </P>
        <P>
          We are excited to welcome advanced LabVIEW developers and Architects
          (certified or self-proclaimed) from around the world to network and
          participate in an inclusive, all-digital, free event.
        </P>
        <P>
          Recordings of previous presentations are available via the{' '}
          <a
            href='https://www.youtube.com/c/GlobalLabVIEWArchitects'
            className='underline'
          >
            GLA Summit YouTube channel
          </a>{' '}
          - we hope that you are as excited as we are to have these great
          resources available to rewatch!
        </P>
        <P>
          Many parts of the website are currently being updated and refactored
          to improve our ability to deliver a smooth experience with logins,
          presentation submissions and submission review, amongst other
          features.
        </P>
        <P>
          If there&apos;s something you&apos;d like to see in a future version,
          please feel free to let us know at{' '}
          <a href='mailto:web@glasummit.org'>web@glasummit.org</a> and
          we&apos;ll be happy to consider it!
        </P>
      </StackedBoxes>
      {/* <SponsorBar /> */}
    </div>
  );
}
