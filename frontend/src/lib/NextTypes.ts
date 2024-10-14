export type NextParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;
export type NextSearchParams = Promise<any>;
export type satisfy<base, t extends base> = t;
