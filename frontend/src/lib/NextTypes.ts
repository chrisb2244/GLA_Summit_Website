export type NextParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

// This type is defined by the Next.js framework,
// and we write it here to enable future updates.
// It is expected to reference URLSearchParams in the future.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type NextSearchParams = Promise<any>;

export type satisfy<base, t extends base> = t;
