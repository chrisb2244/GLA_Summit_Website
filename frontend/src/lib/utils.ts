const shouldLog = process.env.NODE_ENV !== 'production'

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const myLog = (v: any) => {
  if (shouldLog) {
    console.log(v)
  }
}