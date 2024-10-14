import { redirect } from 'next/navigation';
import { LoginForm } from '../LoginForm';
import { getUser } from '@/lib/supabase/userFunctions';
import { NextSearchParams } from '@/lib/NextTypes';

const LoginPage = async ({
  searchParams
}: {
  searchParams: NextSearchParams;
}) => {
  const redirectToParam = (await searchParams)?.redirectTo;
  const redirectTo =
    typeof redirectToParam === 'string'
      ? decodeURI(redirectToParam)
      : undefined;

  const user = await getUser();
  if (user !== null) {
    redirect(redirectTo ?? '/');
  }

  return <LoginForm redirectTo={redirectTo} />;
};

export default LoginPage;
