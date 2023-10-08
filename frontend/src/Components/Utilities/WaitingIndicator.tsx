import NextImage from 'next/image';
import GLA_Logo from '@/media/GLA-logo-spinnable.svg';

type WaitingIndicatorProps = {
  scale?: number;
  maxLength?: number;
  children?: React.ReactNode;
};

export const WaitingIndicator: React.FC<WaitingIndicatorProps> = ({
  scale = 0.3,
  maxLength = 300
}) => {
  const width = typeof screen === 'undefined' ? 0 : screen.width;
  const length = Math.min(scale * width, maxLength);

  return (
    <div className='relative z-[100]'>
      <div className='fixed inset-0 flex items-center justify-center p-4'>
        <NextImage
          src={GLA_Logo}
          width={length}
          height={length}
          style={{
            animation: 'spin 10s infinite linear'
          }}
          alt='loading indicator'
        />
      </div>
    </div>
  );
};
