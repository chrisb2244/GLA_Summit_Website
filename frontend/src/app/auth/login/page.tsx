import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { LoginForm } from '../LoginForm';
import { getSession } from '@/lib/supabase/userFunctions';
import { NextSearchParams } from '@/lib/NextTypes';

const LoginPage = ({
  searchParams
}: {
  searchParams: NextSearchParams;
}) => {
  // The fallback must NOT be an interactive <LoginForm />: when the content
  // resolves, React swaps the fallback tree for the real one and the remount
  // empties anything typed into the fallback's (uncontrolled) inputs. With the
  // session read below being a cookie parse rather than an Auth round-trip,
  // the gap is a few ms, so an empty fallback is fine.
  return (
    <Suspense fallback={null}>
      <LoginPageContent searchParams={searchParams} />
    </Suspense>
  );
};

const LoginPageContent = async ({
  searchParams
}: {
  searchParams: NextSearchParams;
}) => {

  const redirectToParam = (await searchParams)?.redirectTo;
  const redirectTo =
    typeof redirectToParam === 'string'
      ? decodeURI(redirectToParam)
      : undefined;

  // UX short-circuit only (send an already-logged-in visitor away), so the
  // unverified cookie session is sufficient — proxy.ts has already run a
  // verified getUser() for this request. Nothing here grants access.
  const session = await getSession();
  if (session !== null) {
    redirect(redirectTo ?? '/');
  }

  return <LoginForm redirectTo={redirectTo} />;
};

export default LoginPage;
