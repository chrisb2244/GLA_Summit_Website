import { Icon } from '@mdi/react';
import { mdiAccountCircle } from '@mdi/js';
import NextImage from 'next/image';

type UserIconProps = {
  src?: string;
  size?: 'large' | 'small';
  text?: string;
};

export const DefaultUserIcon = (props: Omit<UserIconProps, 'src'>) => {
  return <Icon path={mdiAccountCircle} size={props.size === 'large' ? 2 : 1} />;
};

export const UserIcon = (props: UserIconProps) => {
  const { src, size = 'large', text } = props;
  const pxSz = size === 'large' ? 48 : 24;

  const icon =
    typeof src !== 'undefined' ? (
      <NextImage
        src={src}
        alt={`usericon_${text}`}
        width={pxSz}
        height={pxSz}
        className='inline-flex rounded-full object-cover'
      />
    ) : (
      <DefaultUserIcon size={size} text={text} />
    );

  const wrappedIcon = (
    <div className='inline-flex flex-shrink-0 text-opacity-50'>{icon}</div>
  );

  if (typeof text === 'undefined') {
    return wrappedIcon;
  }

  return (
    <span className='flex flex-row items-center space-x-1'>
      <span>{text}</span>
      {wrappedIcon}
    </span>
  );
};
