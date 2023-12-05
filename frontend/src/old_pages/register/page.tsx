'use client';
import { CenteredDialog } from '@/Components/CenteredDialog';
import { usePathname, useRouter } from 'next/navigation';
import { RegistrationForm } from 'src/app/auth/register/RegistrationForm';

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
      <RegistrationForm />
    </CenteredDialog>
  );
};

export default LoginModalPage;
