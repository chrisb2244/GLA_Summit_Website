import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { SponsorBar } from '@/Components/SponsorBar'
import React, { ReactNode } from 'react'

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
