import NextLink from 'next/link'
import { MenuElement } from './MenuBar'

// As written, this can be rendered as a Server Component
export const DesktopMenuItems = (props: {
  menuElements: MenuElement[]
}) => {
  return (
    <>
      {props.menuElements.map(({ title, link }) => {
        return (
          <NextLink
            href={link}
            role='menuitem'
            key={title}
            className='flex mx-1 px-1 self-center min-w-[64px] h-full hover:bg-secondaryc'
          >
            <span className='text-[18px] line-height-[28px] p-2'>
              {title.toUpperCase()}
            </span>
          </NextLink>
        )
      })}
    </>
  )
}
