import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { RegistrationForm } from '../RegistrationForm';
import { getSession } from '@/lib/supabase/userFunctions';
import { NextSearchParams } from '@/lib/NextTypes';

const RegistrationPage = ({
  searchParams
}: {
  searchParams: NextSearchParams;
}) => {
  // The fallback must NOT be an interactive <RegistrationForm />: when the
  // content resolves, React swaps the fallback tree for the real one and the
  // remount empties anything typed into the fallback's (uncontrolled) inputs.
  // With the session read below being a cookie parse rather than an Auth
  // round-trip, the gap is a few ms, so an empty fallback is fine.
  return (
    <Suspense fallback={null}>
      <RegistrationPageContent searchParams={searchParams} />
    </Suspense>
  );
};

const RegistrationPageContent = async ({
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

  // Carried over from the sign-in form so switching across never means
  // retyping the address.
  const emailParam = (await searchParams)?.email;
  const email =
    typeof emailParam === 'string' ? decodeURI(emailParam) : undefined;

  return <RegistrationForm redirectTo={redirectTo} email={email} />;
};

export default RegistrationPage;
