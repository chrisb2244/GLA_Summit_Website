'use client';
import { CenteredDialog } from '@/Components/CenteredDialog';
import { usePathname, useRouter } from 'next/navigation';
import { LoginForm } from 'src/app/auth/login/LoginForm';

const LoginModalPage = () => {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <CenteredDialog
      open={pathname === '/auth/login'}
      onClose={() => {
        console.log('Login modal close event');
        router.back();
        // router.push('/auth/validateLogin', {});
      }}
    >
      <LoginForm />
    </CenteredDialog>
  );
};

export default LoginModalPage;
