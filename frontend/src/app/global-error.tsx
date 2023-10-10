'use client'
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.log({error})
  
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <p>This is the global error handler</p>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}