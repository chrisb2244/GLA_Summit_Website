import React, { AnchorHTMLAttributes, PropsWithChildren } from 'react'

export const LinkLikeText: React.FC<
  PropsWithChildren<{ className?: string } & AnchorHTMLAttributes<HTMLAnchorElement>>
> = ({ children, className, ...otherProps }) => {
  return (
    <a
      className={`text-blue-500 underline hover:decoration-2 cursor-pointer ${className}`}
      {...otherProps}
    >
      {children}
    </a>
  )
}
