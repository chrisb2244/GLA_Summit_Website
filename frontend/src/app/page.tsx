import { Metadata } from 'next';
import { SponsorBar } from './_rootElements/SponsorBar';
// import { SubmitPresentationButton } from './_homepage/SubmitPresentationButton';
// import { Countdown } from './_rootElements/Countdown'

export const metadata: Metadata = {
  title: {
    absolute: 'GLA Summit 2024'
  }
};

export default async function Page() {
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

  // const generalEventButton = (
  //   <a href='https://app.events.ringcentral.com/events/gla-2024'>
  //     <Button fullWidth>Go to the Event!</Button>
  //   </a>
  // );

  // const websiteUpdateNotice = (
  //   <>
  //     <p>
  //       Many parts of the website are currently being updated and refactored to
  //       improve our ability to deliver a smooth experience with logins,
  //       presentation submissions and submission review, amongst other features.
  //     </p>
  //     <p>
  //       If there&apos;s something you&apos;d like to see in a future version,
  //       please feel free to let us know at{' '}
  //       <a href='mailto:web@glasummit.org' className='link'>
  //         web@glasummit.org
  //       </a>{' '}
  //       and we&apos;ll be happy to consider it!
  //     </p>
  //   </>
  // );

  return (
    <div className='prose prose-base mx-auto max-w-2xl text-justify xl:max-w-3xl'>
      {/* <p className='prose-lg text-center'>
        The GLA Summit Organizers are excited to announce the next GLA Summit,
        scheduled for 25-26 March 2024!
      </p> */}
      <p className='prose-lg text-center'>
        The GLA Summit Organizers would like to thank all those
        <br />
        who presented at, or attended,
        <br />
        the GLA Summit 2024 on 25-26 March 2024!
      </p>
      <p>
        We were excited to welcome advanced LabVIEW developers and Architects
        (certified or self-proclaimed) from around the world to network and
        participate in an inclusive, all-digital, free event.
      </p>
      <p>
        We will be uploading recordings of the presentations to our YouTube
        channel soon.
      </p>
      {/* <div>{ticketButton}</div> */}
      {/* <div>
        <p className='text-center'>
          The GLA Summit event page is now open! You can find the event page at{' '}
          <a
            href='https://app.events.ringcentral.com/events/gla-2024'
            className='link'
          >
            https://app.events.ringcentral.com/events/gla-2024
          </a>
          .
        </p>
        {generalEventButton}
        <p>
          If you registered for a ticket using this website, you should have
          received an email with a customised link - you can use that directly
          to access the platform rather than using the generic link above.
        </p>
      </div> */}
      {/* <div>
        <p>
          <span className='font-semibold'>
            We&apos;re closing submissions very soon
          </span>
          , so if you want to speak, submit a presentation now. If you need to
          adjust the abstract or title of your presentation, this can be done
          once we have responded to your presentation.
        </p>
        <SubmitPresentationButton />
      </div> */}

      <p>
        Recordings of previous presentations are available via the{' '}
        <a
          href='https://www.youtube.com/c/GlobalLabVIEWArchitects'
          className='link'
        >
          GLA Summit YouTube channel
        </a>{' '}
        - we hope that you are as excited as we are to have these great
        resources available to rewatch!
      </p>
      {/* websiteUpdateNotice */}
      <SponsorBar />
    </div>
  );
}
