'use server';
import 'server-only'; // Poison the module for client code.

import { generateSupabaseLinks } from '@/lib/generateSupabaseLinks';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { sendMailApi } from '@/lib/sendMail';
import { PersonProps } from '../Form';
import { User, UserMetadata } from '@supabase/supabase-js';

export const mailUser = async () => {
  // Send email
};

export const signOut = async () => {
  await createServerActionClient({ cookies }).auth.signOut();
};

export const getUser = async () => {
  const supabase = createServerActionClient({ cookies });
  return await supabase.auth.getUser().then(({ data, error }) => {
    if (error) {
      return null;
    }
    return data.user;
  });
};

export const getIsOrganizer = async (user: User) => {
  const supabase = createServerActionClient({ cookies });

  return supabase
    .from('organizers')
    .select()
    .eq('id', user.id)
    .maybeSingle()
    .then((v) => v.data !== null);
};

export const verifyLogin = async (data: {
  email: string;
  verificationCode: string;
}) => {
  return createServerActionClient({ cookies })
    .auth.verifyOtp({
      email: data.email,
      token: data.verificationCode,
      type: 'email'
    })
    .then((res) => {
      return res.data.user !== null;
    });
};

export const signIn = async (
  email: string,
  options?: { redirectTo?: string; scopes?: string; captchaToken?: string }
): Promise<boolean> => {
  console.log('Generating signin link');
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
        bodyPlain: plainText //`Your One-Time Passcode is ${v.data.properties.email_otp}`
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

export const signUp = async (
  newUser: PersonProps,
  redirectTo?: string
): Promise<boolean> => {
  // Sign up
  console.log('Generating signup link');
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
    console.log({ data, error, m: 'signup' });
    if (error) {
      return false;
    }
    const subject = 'GLA Summit Website Signup';
    const otp = data.properties.email_otp;
    const plainText = otpEmailText(newUser.firstName, newUser.lastName, otp);
    sendMailApi({
      to: email,
      subject,
      bodyPlain: plainText,
      body: plainText
    });
    return true;
  });
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
