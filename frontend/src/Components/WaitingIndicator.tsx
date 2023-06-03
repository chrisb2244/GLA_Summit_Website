import NextImage from 'next/image'
import GLA_Logo from '@/media/GLA-logo-spinnable.svg'

type WaitingIndicatorProps = {
  scale?: number
  maxLength?: number
  children?: React.ReactNode
}

export const WaitingIndicator: React.FC<
  React.PropsWithChildren<WaitingIndicatorProps>
> = ({
  scale = 0.3,
  maxLength = 300,
  children
}) => {
  const width = typeof screen === 'undefined' ? 0 : screen.width
  const length = Math.min(scale * width, maxLength)

  return (
    <div>
      <NextImage
        src={GLA_Logo}
        width={length}
        height={length}
        style={{
          animation: 'spin 10s infinite linear'
        }}
        alt='loading indicator'
      />
      {children}
    </div>
  )
}
