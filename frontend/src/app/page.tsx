import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/Components/Form/Button';
import { createServerComponentClient } from '@/lib/supabaseServer';
// import { SponsorBar } from './_rootElements/SponsorBar';
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

  // const registrationButton = false ? (
  //   <Box>
  //     <Link href={'https://hopin.com/events/gla-summit-2022'}>
  //       <Button fullWidth variant='contained' className='bg-primaryc'>
  //         Register for a ticket at Hopin
  //       </Button>
  //     </Link>
  //   </Box>
  // ) : null

  const supabase = createServerComponentClient();
  const user =
    (await supabase.auth.getSession())?.data.session?.user ?? undefined;

  const loggedIn = typeof user !== 'undefined';
  const submitPresentationButton = (
    <Link
      href={
        loggedIn
          ? '/my-presentations'
          : '/auth/register?redirectTo=/my-presentations'
      }
      prefetch={false}
      scroll={loggedIn}
    >
      <Button fullWidth>Submit a Presentation</Button>
    </Link>
  );

  return (
    <div className='prose prose-base mx-auto max-w-2xl text-justify xl:max-w-3xl'>
      <p className='prose-lg text-center'>
        The GLA Summit Organizers are excited to announce the next GLA Summit,
        scheduled for 25-26 March 2024!
      </p>
      <div>{submitPresentationButton}</div>
      <p>
        We are excited to welcome advanced LabVIEW developers and Architects
        (certified or self-proclaimed) from around the world to network and
        participate in an inclusive, all-digital, free event.
      </p>
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
      <p>
        Many parts of the website are currently being updated and refactored to
        improve our ability to deliver a smooth experience with logins,
        presentation submissions and submission review, amongst other features.
      </p>
      <p>
        If there&apos;s something you&apos;d like to see in a future version,
        please feel free to let us know at{' '}
        <a href='mailto:web@glasummit.org' className='link'>
          web@glasummit.org
        </a>{' '}
        and we&apos;ll be happy to consider it!
      </p>
      {/* <SponsorBar /> */}
    </div>
  );
}
