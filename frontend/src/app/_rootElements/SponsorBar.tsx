import NI_Logo from '@/media/NI-Logo.png'
import GCentral_Logo from '@/media/GCentral-logo-color.svg'
import SAS_Logo from '@/media/SAS-Logo.png'
import CorgiBytes_Logo from '@/media/corgibytes-logo.png'
import HeartWare_Dev_Logo from '@/media/heartware-dev-logo.png' // #1e143e_bg

import Link from 'next/link'
import NextImage, { type StaticImageData } from 'next/image'

export const SponsorBar: React.FC<React.PropsWithChildren<unknown>> = () => {
  type Supporter = {
    title: string
    href: string
    src: string | StaticImageData
    width: number
    height: number
    imgWrapperCName?: string
  }

  const supporters: Array<Supporter> = [
    {
      title: 'GCentral',
      src: GCentral_Logo,
      href: 'https://www.gcentral.org/',
      width: 120,
      height: 120
    },
    {
      title: 'CorgiBytes',
      src: CorgiBytes_Logo,
      href: 'https://corgibytes.com/',
      width: 275,
      height: 79
    },
    {
      title: 'HeartWare',
      src: HeartWare_Dev_Logo,
      href: 'https://www.heartware.dev/',
      width: 1000,
      height: 250,
      imgWrapperCName: 'bg-[#1e143e]'
    },
    {
      title: 'SAS Workshops',
      src: SAS_Logo,
      href: 'https://www.sasworkshops.com/',
      width: 100,
      height: 100
    }
  ]

  const supporterElements = supporters.map((s) => {
    return (
      <>
        <h5 className='px-4 text-lg md:row-span-1 flex mx-auto' key={`${s.title}-heading`}>{s.title}</h5>
        <a
          href={s.href}
          className='p-4 md:p-0 md:px-4 md:row-start-2 flex m-auto'
          key={`${s.title}-link`}
        >
          <div className={`my-auto max-h-[100px] ${s.imgWrapperCName ?? ''}`}>
            <NextImage
              src={s.src}
              width={(s.width / s.height) * 100}
              height={100}
              className='object-scale-down'
              alt={`${s.title} Logo`}
            />
          </div>
        </a>
      </>
    )
  })

  return (
    <div className='flex flex-col items-center justify-center'>
      <div className='px-8 py-4 shadow-lg'>
        <Link href='https://www.ni.com' className='py-4'>
          <div className='flex xs:flex-col-reverse md:flex-row items-center justify-center w-fit'>
            <NextImage src={NI_Logo} width={180} height={180} alt='NI Logo' />
            <h5 className='px-4 text-xl'>Sponsored by NI</h5>
          </div>
        </Link>
      </div>

      <div className='px-8 py-2 shadow-lg mt-2 flex flex-col justify-center items-center'>
        <h5>Supported by:</h5>
        <div className='flex flex-col pt-4 align-middle md:grid md:grid-rows-[4rem, 1fr]'>
          {supporterElements}
        </div>
      </div>
    </div>
  )
}
