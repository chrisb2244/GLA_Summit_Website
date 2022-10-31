import NextLink from 'next/link'

// As written, this can be rendered as a Server Component
export const DesktopMenuBar = (props: {
  menuElements: Array<{ title: string; link: string }>
}) => {
  return (
    <div
      id='desktop-menu'
      className='xs:hidden md:flex pl-2 flex-grow content-center bg-primaryc text-white'
      role='menu'
    >
      {props.menuElements.map(({ title, link }) => {
        return (
          <div className='flex mx-2 self-center min-w-[64px]' key={title}>
            <NextLink href={link} role='menuitem'>
              <span className='text-[18px] line-height-[28px] p-2'>
                {title.toUpperCase()}
              </span>
            </NextLink>
          </div>
        )
      })}
    </div>
  )
}
