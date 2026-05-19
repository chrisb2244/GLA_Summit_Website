import { RedirectType, redirect } from 'next/navigation';

import type { PersonProps } from '../Form/Person';

const AUTH_BLOCKED_PATH = '/auth-blocked';
const BLOCKED_EMAIL_DOMAINS = [/@mail\.ru$/i, /@yandex\.ru$/i];
const FLAGGED_NAME_PATTERNS = [/https?:\/\/.*/, /blogspot\./, /ok\.me/];

const redirectToAuthBlocked = () => {
  redirect(AUTH_BLOCKED_PATH, RedirectType.push);
};

export const blockIfEmailIsDisallowed = (email: string) => {
  if (BLOCKED_EMAIL_DOMAINS.some((pattern) => pattern.test(email))) {
    redirectToAuthBlocked();
  }
};

export const blockIfProfileIsFlagged = ({
  firstName,
  lastName,
  email
}: PersonProps) => {
  blockIfEmailIsDisallowed(email);

  if (firstName.length > 35 || lastName.length > 35) {
    redirectToAuthBlocked();
  }

  if (FLAGGED_NAME_PATTERNS.some((pattern) => pattern.test(firstName) || pattern.test(lastName))) {
    redirectToAuthBlocked();
  }
};
