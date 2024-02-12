'use client';
import { usePathname, useRouter } from 'next/navigation';

export const SignInUpButton = () => {
  const router = useRouter();
  const pathName = usePathname();
  const appendedRedirect = pathName !== '/' ? `?redirectTo=${pathName}` : '';

  return (
    <button
      className='flex h-full px-2 hover:bg-secondaryc'
      onClick={() => {
        router.push(`/auth/login${appendedRedirect}`, { scroll: false });
      }}
    >
      <span className='prose prose-lg p-2 text-white '>Sign In / Register</span>
    </button>
  );
};
