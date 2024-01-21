'use client';
import { CenteredDialog } from '@/Components/CenteredDialog';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from 'src/app/auth/LoginForm';
import { RegistrationForm } from 'src/app/auth/RegistrationForm';
import { VerifyForm } from 'src/app/auth/VerifyForm';

const AuthPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const email = useSearchParams()?.get('email') ?? undefined;
  const redirectTo = useSearchParams()?.get('redirectTo') ?? undefined;

  let form: JSX.Element | null = null;
  switch (true) {
    case pathname === '/auth/login':
      form = <LoginForm redirectTo={redirectTo} />;
      break;
    case pathname === '/auth/register':
      form = <RegistrationForm redirectTo={redirectTo} />;
      break;
    case pathname === '/auth/validateLogin':
      form = <VerifyForm email={email} redirectTo={redirectTo} />;
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
        // This is triggered only when cancelling (e.g. click outside)
        // Otherwise, the form submission actions trigger a redirect
        router.back();
      }}
    >
      {form}
    </CenteredDialog>
  );
};

export default AuthPage;
