import { ReactNode, ReactElement } from 'react';
import Image, { StaticImageData } from 'next/image';
import { mdiAccount } from '@mdi/js';
import Icon from '@mdi/react';
import NextLink from 'next/link';
import type { Route } from 'next';
import { formatTextToPs } from '@/lib/utils';

export interface PersonDisplayProps {
  firstName: string;
  lastName: string;
  description: string | ReactElement;
  image?: StaticImageData | string | null;
  imageSide?: 'left' | 'right';
  useDefaultIconImage?: boolean;
  stripContainer?: boolean;
  pageLink?: Route;
}

export const PersonDisplay: React.FC<
  PersonDisplayProps & { children?: ReactNode }
> = ({ pageLink, ...props }) => {
  const md_direction =
    typeof props.imageSide !== 'undefined'
      ? props.imageSide === 'right'
        ? 'md:flex-row'
        : 'md:flex-row-reverse'
      : 'md:flex-row';

  let isDefaultImage = false;
  let imageElem = null;
  if (typeof props.image !== 'undefined' && props.image !== null) {
    // Static image file or by URL
    imageElem = (
      <Image
        fill
        src={props.image}
        alt={`Image of ${props.firstName} ${props.lastName}`}
        className='object-contain'
        sizes='(max-width: 899px) 100vw, 30vw'
      />
    );
  } else {
    // No image
    if (props.useDefaultIconImage) {
      isDefaultImage = true;
      imageElem = <Icon path={mdiAccount} size={8} />;
    }
  }

  let descriptionElem: JSX.Element | null = null;
  if (typeof props.description === 'string') {
    descriptionElem = <>{formatTextToPs(props.description)}</>;
  } else {
    descriptionElem = props.description;
  }

  const TitleComponent = ({ children }: { children?: ReactNode }) => {
    if (typeof pageLink !== 'undefined') {
      return (
        <NextLink href={pageLink} className='link'>
          {children}
        </NextLink>
      );
    } else {
      return <>{children}</>;
    }
  };

  const imgDispCName = isDefaultImage ? 'max-sm:hidden' : '';

  return (
    <div className={`${props.stripContainer ? '' : 'rounded shadow-md'}`}>
      <div
        className={`flex flex-col ${md_direction} my-2 content-center justify-around space-x-4`}
      >
        <div className={`my-auto flex-grow items-center`}>
          <h3 className='my-0'>
            <TitleComponent>
              {props.firstName} {props.lastName}
            </TitleComponent>
          </h3>
          <div className='space-y-4 whitespace-pre-wrap text-justify'>
            {descriptionElem}
          </div>
        </div>
        <div
          className={`not-prose relative w-full flex-shrink-0 align-middle md:w-[30%] ${imgDispCName} flex flex-row justify-center`}
        >
          {imageElem}
        </div>
      </div>
    </div>
  );
};
