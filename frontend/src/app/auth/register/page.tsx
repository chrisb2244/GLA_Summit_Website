import { createServerComponentClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { RegistrationForm } from '../RegistrationForm';

const RegistrationPage = async () => {
  const supabase = createServerComponentClient();
  const session = (await supabase.auth.getSession()).data.session;
  const isLoggedIn = session !== null;
  if (isLoggedIn) {
    redirect('/');
  }

  return <RegistrationForm />;
};

export default RegistrationPage;
