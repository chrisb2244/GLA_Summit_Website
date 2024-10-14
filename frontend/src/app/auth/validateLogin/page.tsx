import { redirect } from 'next/navigation';
import { VerifyForm } from '../VerifyForm';
import { getUser } from '@/lib/supabase/userFunctions';
import { NextSearchParams } from '@/lib/NextTypes';

const ValidateLoginPage = async ({
  searchParams
}: {
  searchParams?: NextSearchParams;
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

  const emailParam = (await searchParams)?.email;
  const email =
    typeof emailParam === 'string' ? decodeURI(emailParam) : undefined;

  return <VerifyForm email={email} redirectTo={redirectTo} />;
};

export default ValidateLoginPage;
