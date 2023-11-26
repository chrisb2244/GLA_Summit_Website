import { createServerComponentClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { VerifyForm } from '../VerifyForm';

type SearchParams = { [key: string]: string | string[] | undefined };

const ValidateLoginPage = async ({
  searchParams
}: {
  searchParams?: SearchParams;
}) => {
  const supabase = createServerComponentClient();
  const session = (await supabase.auth.getSession()).data.session;
  const isLoggedIn = session !== null;
  if (isLoggedIn) {
    redirect('/');
  }

  const emailParam = searchParams?.email;
  const email =
    typeof emailParam === 'string' ? decodeURI(emailParam) : undefined;
  const redirectToParam = searchParams?.redirectTo;
  const redirectTo =
    typeof redirectToParam === 'string'
      ? decodeURI(redirectToParam)
      : undefined;

  return <VerifyForm email={email} redirectTo={redirectTo} />;
};

export default ValidateLoginPage;
