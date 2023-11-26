'use client';
import { CenteredDialog } from '@/Components/CenteredDialog';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from 'src/app/auth/LoginForm';
import { RegistrationForm } from 'src/app/auth/RegistrationForm';
import { VerifyForm } from 'src/app/auth/VerifyForm';

const AuthPage = () => {
  const pathname = usePathname();
  const router = useRouter();

  let form: JSX.Element | null = null;
  switch (true) {
    case pathname === '/auth/login':
      form = <LoginForm />;
      break;
    case pathname === '/auth/register':
      form = <RegistrationForm />;
      break;
    case pathname === '/auth/validateLogin':
      const email = useSearchParams()?.get('email') ?? undefined;
      form = <VerifyForm email={email} />;
      break;
    default:
      break;
  }

  if (form === null) {
    return null;
  }

  return (
    <CenteredDialog
      open={true}
      onClose={() => {
        router.push('/');
      }}
    >
      {form}
    </CenteredDialog>
  );
};

export default AuthPage;
