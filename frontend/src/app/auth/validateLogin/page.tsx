import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { VerifyForm } from '../VerifyForm';
import { getUser } from '@/lib/supabase/userFunctions';
import { NextSearchParams } from '@/lib/NextTypes';

const ValidateLoginPage = ({
  searchParams
}: {
  searchParams?: NextSearchParams;
}) => {
  // The dynamic access (searchParams, getUser) must live inside this Suspense
  // boundary because `cacheComponents` is enabled — otherwise Next.js raises
  // "Uncached data was accessed outside of <Suspense>" at build/dev time.
  //
  // The fallback is intentionally `null` rather than a <VerifyForm>: a fallback
  // VerifyForm renders the email input and is then unmounted/replaced when the
  // content resolves, which both flashes the email field for real users and
  // drops any in-progress verification-code input in tests. A null fallback
  // causes no layout shift here because the root layout's `flex: 1 0 auto`
  // middle region already reserves the vertical space.
  return (
    <Suspense fallback={null}>
      <ValidateLoginPageContent searchParams={searchParams} />
    </Suspense>
  );
};

const ValidateLoginPageContent = async ({
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
