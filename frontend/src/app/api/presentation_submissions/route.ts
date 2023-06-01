import { redirect } from "next/navigation"

export function GET() {
  // Default to 'this' year
  const thisYearString = '2022' // new Date().getUTCFullYear().toString()
  redirect('/api/presentation_submissions/' + thisYearString)
}
