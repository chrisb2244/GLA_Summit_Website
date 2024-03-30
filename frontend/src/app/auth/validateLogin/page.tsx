import { redirect } from 'next/navigation';
import { VerifyForm } from '../VerifyForm';
import { getUser } from '@/lib/supabase/userFunctions';

type SearchParams = { [key: string]: string | string[] | undefined };

const ValidateLoginPage = async ({
  searchParams
}: {
  searchParams?: SearchParams;
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

  const emailParam = searchParams?.email;
  const email =
    typeof emailParam === 'string' ? decodeURI(emailParam) : undefined;

  return <VerifyForm email={email} redirectTo={redirectTo} />;
};

export default ValidateLoginPage;
