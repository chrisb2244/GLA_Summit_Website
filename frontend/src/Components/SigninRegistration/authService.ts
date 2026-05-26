import { randomBytes } from 'crypto';

import type { UserMetadata } from '@supabase/supabase-js';

import { RegistrationEmailFn } from '@/EmailTemplates/RegistrationEmail';
import { SignInEmailFn } from '@/EmailTemplates/SignInEmail';
import { generateSupabaseLinks } from '@/lib/generateSupabaseLinks';
import { sendMailApi } from '@/lib/sendMail';
import { createServerActionClient } from '@/lib/supabaseServer';
import { logToDb } from '@/lib/utils';

import type { PersonProps } from '../Form/Person';

export const verifyLogin = async (data: {
  email: string;
  verificationCode: string;
}): Promise<boolean> => {
  const supabase = await createServerActionClient();
  const { data: verifyData } = await supabase.auth.verifyOtp({
    email: data.email,
    token: data.verificationCode,
    type: 'email'
  });

  return verifyData.user !== null;
};

export const signIn = async (email: string, redirectTo?: string): Promise<boolean> => {
  try {
    const response = await generateSupabaseLinks({
      type: 'magiclink',
      email,
      redirectTo
    });

    const { properties, user } = response.data;
    if (properties == null) {
      await logToDb('error', 'No OTP properties returned during sign-in', 'auth/signin');
      return false;
    }

    const { firstName, lastName } = parseUserMetadata(user.user_metadata);
    const plainText = otpEmailText(firstName, lastName, properties.email_otp);
    const mailResult = await sendMailApi({
      subject: 'Validation Code for GLA Summit Login',
      to: email,
      bodyPlain: plainText,
      body: SignInEmailFn(`${firstName} ${lastName}`, properties.email_otp, email)
    });

    return mailResult.status === 200;
  } catch (err) {
    await logToDb('error', 'Failed to send sign-in link', 'auth/signin', {
      context: { message: err instanceof Error ? err.message : String(err) }
    });
    return false;
  }
};

export const signUp = async (newUser: PersonProps, redirectTo?: string): Promise<boolean> => {
  const password = randomBytes(32).toString('hex');
  const email = newUser.email;

  const { data, error } = await generateSupabaseLinks({
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
  });

  if (error || data.properties == null) {
    return false;
  }

  const otp = data.properties.email_otp;
  const mailResult = await sendMailApi({
    to: email,
    subject: 'GLA Summit Website Signup',
    bodyPlain: otpEmailText(newUser.firstName, newUser.lastName, otp),
    body: RegistrationEmailFn(`${newUser.firstName} ${newUser.lastName}`, otp, email)
  });

  return mailResult.status === 200;
};

const otpEmailText = (firstName: string, lastName: string, otp: string) => {
  const firstLine = `Dear ${firstName} ${lastName},\r\n`;
  const mainLine = `Your One-Time-Passcode (OTP) token is ${otp}\r\n`;
  const signature = 'GLA Summit Organizers';
  return [firstLine, mainLine, signature].join('\r\n');
};

const parseUserMetadata = (metadata: UserMetadata): { firstName: string; lastName: string } => {
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
  }

  return {
    firstName: 'GLA Summit',
    lastName: 'User'
  };
};
