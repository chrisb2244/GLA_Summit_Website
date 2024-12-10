import { redirect } from 'next/navigation';
import { RegistrationForm } from '../RegistrationForm';
import { getUser } from '@/lib/supabase/userFunctions';
import { NextSearchParams } from '@/lib/NextTypes';

const RegistrationPage = async ({
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

  return <RegistrationForm redirectTo={redirectTo} />;
};

export default RegistrationPage;
