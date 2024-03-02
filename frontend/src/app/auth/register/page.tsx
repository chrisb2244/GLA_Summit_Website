import { createServerComponentClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { RegistrationForm } from '../RegistrationForm';

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

  const supabase = createServerComponentClient();
  const session = (await supabase.auth.getSession()).data.session;
  const isLoggedIn = session !== null;
  if (isLoggedIn) {
    redirect(redirectTo ?? '/');
  }

  return <RegistrationForm redirectTo={redirectTo} />;
};

export default RegistrationPage;
