const shouldLog = process.env.NODE_ENV !== 'production'

export const myLog = (v: any) => {
  if (shouldLog) {
    console.log(v)
  }
}