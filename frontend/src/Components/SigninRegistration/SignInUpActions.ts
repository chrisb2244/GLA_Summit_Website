'use server';
import 'server-only'; // Poison the module for client code.

import { generateSupabaseLinks } from '@/lib/generateSupabaseLinks';
import { createServerActionClient } from '@/lib/supabaseServer';
import { randomBytes } from 'crypto';
import { sendMailApi } from '@/lib/sendMail';
import { PersonProps } from '../Form/Person';
import { UserMetadata } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { SignInEmailFn } from '@/EmailTemplates/SignInEmail';
import { RegistrationEmailFn } from '@/EmailTemplates/RegistrationEmail';
import { RedirectType, redirect } from 'next/navigation';

const filterEmails = (email: string) => {
  if (email.match(/.*@mail\.ru/) || email.match(/.*@yandex\.ru/)) {
    // Block signups from @mail.ru
    redirect('/auth-blocked', RedirectType.push);
  }
};

const filterProfileData = ({ firstName, lastName, email }: PersonProps) => {
  filterEmails(email);
  const urlMatcher = /https?:\/\/.*/;
  if (firstName.match(urlMatcher) || lastName.match(urlMatcher)) {
    redirect('/auth-blocked', RedirectType.push);
  }
};

export const signOut = async () => {
  await (await createServerActionClient()).auth.signOut();
  revalidatePath('/');
};

export const verifyLogin = async (data: {
  email: string;
  verificationCode: string;
}) => {
  const supabase = await createServerActionClient();
  return await supabase.auth
    .verifyOtp({
      email: data.email,
      token: data.verificationCode,
      type: 'email'
    })
    .then((res) => {
      return res.data.user !== null;
    });
};

export type VerificationState =
  | {
      success: true;
      message: undefined;
    }
  | {
      success: false;
      message: string;
    }
  | null;

export const verifyLoginWithRedirectFromForm = async (
  previousState: VerificationState,
  data: FormData
): Promise<VerificationState> => {
  const email = data.get('email');
  const redirectToValue = data.get('redirectTo');
  const redirectTo =
    typeof redirectToValue === 'string' ? redirectToValue : '/';
  const verificationCode = data.get('verificationCode');
  if (typeof email !== 'string' || typeof verificationCode !== 'string') {
    return {
      success: false,
      message: 'Invalid input.'
    };
  }
  const result = await verifyLogin({
    email,
    verificationCode
  });
  if (result) {
    redirect(redirectTo);
  }
  return {
    success: false,
    message: 'Invalid verification code.'
  };
};

export const signIn = async (
  email: string,
  options?: { redirectTo?: string; scopes?: string; captchaToken?: string }
): Promise<boolean> => {
  return generateSupabaseLinks({
    type: 'magiclink',
    email,
    redirectTo: options?.redirectTo
  })
    .then(async (v) => {
      const { properties, user } = v.data;
      if (properties == null) {
        console.log('Some error?');
        console.log(v.data);
        return false;
      }
      const { firstName, lastName } = parseUserMetadata(user.user_metadata);
      const plainText = otpEmailText(firstName, lastName, properties.email_otp);
      const mailResult = await sendMailApi({
        subject: 'Validation Code for GLA Summit Login',
        to: email,
        bodyPlain: plainText, //`Your One-Time Passcode is ${v.data.properties.email_otp}`
        body: SignInEmailFn(
          `${firstName} ${lastName}`,
          properties.email_otp,
          email
        )
      });
      if (mailResult.status === 200) {
        return true;
      } else {
        throw new Error(mailResult.message);
      }
    })
    .catch((err) => {
      console.log(`Failed to send a sign-in link: ${err}`);
      return false;
    });
};

export const signInFromFormWithRedirect = async (formData: FormData) => {
  const email = formData.get('email');
  if (email === null || typeof email !== 'string') {
    return false;
  }
  filterEmails(email);
  const redirectTo = formData.get('redirectTo');
  const params = new URLSearchParams();
  params.append('email', email);
  if (typeof redirectTo === 'string' && redirectTo !== '') {
    params.append('redirectTo', redirectTo);
  }
  const signInSuccessful = await signIn(email);
  if (signInSuccessful) {
    const redirectUrl = `/auth/validateLogin?${params.toString()}`;
    redirect(redirectUrl, RedirectType.push);
  }
};

export const signUp = async (
  newUser: PersonProps,
  redirectTo?: string
): Promise<boolean> => {
  // Sign up
  const password = randomBytes(32).toString('hex');
  const email = newUser.email;

  return generateSupabaseLinks({
    type: 'signup',
    email,
    signUpData: {
      password,
      data: {
        firstname: newUser.firstName,
        lastname: newUser.lastName
      }
    },
    redirectTo
  }).then(({ data, error }) => {
    // console.log({ data, error, m: 'signup' });
    if (error) {
      return false;
    }
    const subject = 'GLA Summit Website Signup';
    const otp = data.properties.email_otp;
    const plainText = otpEmailText(newUser.firstName, newUser.lastName, otp);
    const html = RegistrationEmailFn(
      `${newUser.firstName} ${newUser.lastName}`,
      otp,
      email
    );
    sendMailApi({
      to: email,
      subject,
      bodyPlain: plainText,
      body: html
    });
    return true;
  });
};

export const registerFromFormWithRedirect = async (formData: FormData) => {
  const email = formData.get('email');
  if (email === null || typeof email !== 'string') {
    return false;
  }
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  if (firstName === null || typeof firstName !== 'string') {
    return false;
  }
  if (lastName === null || typeof lastName !== 'string') {
    return false;
  }
  const newUser: PersonProps = {
    firstName,
    lastName,
    email
  };
  filterProfileData(newUser);
  const redirectTo = formData.get('redirectTo');
  const params = new URLSearchParams();
  params.append('email', email);
  if (typeof redirectTo === 'string' && redirectTo !== '') {
    params.append('redirectTo', redirectTo);
  }
  const signUpSuccessful = await signUp(newUser);
  if (signUpSuccessful) {
    redirect(`/auth/validateLogin?${params.toString()}`, RedirectType.push);
  }
};

const otpEmailText = (fname: string, lname: string, otp: string) => {
  const firstline = `Dear ${fname} ${lname},\r\n`;
  const mainline = 'Your One-Time-Passode (OTP) token is ' + otp + '\r\n';
  const signature = 'GLA Summit Organizers';
  return [firstline, mainline, signature].join('\r\n');
};

const parseUserMetadata = (
  metadata: UserMetadata
): { firstName: string; lastName: string } => {
  if (
    Object.hasOwn(metadata, 'firstName') &&
    typeof metadata.firstName === 'string' &&
    Object.hasOwn(metadata, 'lastName') &&
    typeof metadata.lastName === 'string'
  ) {
    return {
      firstName: metadata.firstName,
      lastName: metadata.lastName
    };
  } else {
    return {
      firstName: 'GLA Summit',
      lastName: 'User'
    };
  }
};
