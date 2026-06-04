import NextLink from 'next/link';
import { MenuElement } from './MenuBar';

// As written, this can be rendered as a Server Component
export const DesktopMenuItems = (props: { menuElements: MenuElement[] }) => {
  return (
    <>
      {props.menuElements.map(({ title, link }) => {
        return (
          <NextLink
            href={link}
            role='menuitem'
            key={title}
            className='mx-1 flex h-full items-center justify-center px-1 hover:bg-secondaryc'
          >
            <span className='prose-lg prose p-2 text-white text-center'>
              {title.toUpperCase()}
            </span>
          </NextLink>
        );
      })}
    </>
  );
};
