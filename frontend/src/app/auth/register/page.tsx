import { redirect } from 'next/navigation';
import { RegistrationForm } from '../RegistrationForm';
import { getUser } from '@/lib/supabase/userFunctions';

const RegistrationPage = async ({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  const redirectToParam = searchParams?.redirectTo;
  const redirectTo =
    typeof redirectToParam === 'string'
      ? decodeURI(redirectToParam)
      : undefined;

  const user = await getUser();
  if (user !== null) {
    redirect(redirectTo ?? '/');
  }

  return <RegistrationForm redirectTo={redirectTo} />;
};

export default RegistrationPage;
