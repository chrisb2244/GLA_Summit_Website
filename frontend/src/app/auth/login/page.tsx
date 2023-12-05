import { createServerComponentClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { LoginForm } from '../LoginForm';

const LoginPage = async () => {
  const supabase = createServerComponentClient();
  const session = (await supabase.auth.getSession()).data.session;
  const isLoggedIn = session !== null;
  if (isLoggedIn) {
    redirect('/');
  }

  return <LoginForm />;
};

export default LoginPage;
