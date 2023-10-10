'use client'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.log({error})
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>This is the nested error handler at the top level.</p>
      <p>If this page appears, the error is not in the root layout but within the page.</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}