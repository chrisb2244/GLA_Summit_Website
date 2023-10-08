import { ReactNode, ReactElement } from 'react'
import Image, { StaticImageData } from 'next/image'
import { mdiAccount } from '@mdi/js'
import Icon from '@mdi/react'
import NextLink from 'next/link'
import type { Route } from 'next'

export interface PersonDisplayProps {
  firstName: string
  lastName: string
  description: string | ReactElement
  image?: StaticImageData | string | null
  imageSide?: 'left' | 'right'
  useDefaultIconImage?: boolean
  stripContainer?: boolean
  pageLink?: Route
}

export const PersonDisplay: React.FC<
  PersonDisplayProps & { children?: ReactNode }
> = ({ pageLink, ...props }) => {
  const md_direction =
    typeof props.imageSide !== 'undefined'
      ? props.imageSide === 'right'
        ? 'md:flex-row'
        : 'md:flex-row-reverse'
      : 'md:flex-row'

  let isDefaultImage = false
  let imageElem = null
  if (
    typeof props.image !== 'undefined' &&
    props.image !== null &&
    typeof props.image !== 'string'
  ) {
    // Static image file
    imageElem = (
      <Image
        src={props.image}
        alt={`Image of ${props.firstName} ${props.lastName}`}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          height: 'auto',
          width: '100%',
          objectFit: 'contain'
        }}
      />
    )
  } else if (typeof props.image !== 'undefined' && props.image !== null) {
    // Image by URL
    imageElem = (
      <Image
        fill
        src={props.image}
        alt={`Image of ${props.firstName} ${props.lastName}`}
        className='object-contain'
        sizes='(max-width: 899px) 100vw, 30vw'
      />
    )
  } else {
    // No image
    if (props.useDefaultIconImage) {
      isDefaultImage = true
      imageElem = <Icon path={mdiAccount} size={8} />
    }
  }

  let descriptionElem: JSX.Element | null = null
  if (typeof props.description === 'string') {
    descriptionElem = (
      <>
        {props.description.split('\r\n').map((para, idx) => {
          return <p key={`p${idx}`}>{para}</p>
        })}
      </>
    )
  } else {
    descriptionElem = props.description
  }

  const TitleComponent = ({ children }: { children?: ReactNode }) => {
    if (typeof pageLink !== 'undefined') {
      return (
        <NextLink href={pageLink}>
          <span className='text-3xl link pr-1'>{children}</span>
        </NextLink>
      )
    } else {
      return <h4 className='text-3xl'>{children}</h4>
    }
  }
  const paddingCName = props.stripContainer ? 'p-0' : 'p-4'
  const imgDispCName = isDefaultImage ? 'max-sm:hidden' : ''

  return (
    <div className={props.stripContainer ? '' : 'rounded shadow'}>
      <div
        className={`flex flex-col ${md_direction} justify-around content-center `}
      >
        <div className={`flex-grow ${paddingCName} my-auto items-center`}>
          <TitleComponent>
            {props.firstName} {props.lastName}
          </TitleComponent>
          <div className='my-4 space-y-4 whitespace-pre-wrap text-justify text-lg'>
            {descriptionElem}
          </div>
        </div>
        <div
          className={`relative flex-shrink-0 w-full md:w-[30%] min-h-[200px] my-auto ${paddingCName} ${imgDispCName} flex flex-row justify-center`}
        >
          {imageElem}
        </div>
      </div>
    </div>
  )
}
