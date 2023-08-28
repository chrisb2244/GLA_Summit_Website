import { PresentationReviewInfo } from '@/Components/SubmittedPresentationReviewCard'
import { Database } from '@/lib/sb_databaseModels'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isSummitYear } from '@/lib/databaseModels'

export async function GET(
  req: NextRequest,
  { params }: { params: { year: string } }
) {
  const { year: target_year } = params
  const supabase = createServerComponentClient<Database>({ cookies })

  if (!isSummitYear(target_year)) {
    return NextResponse.json({ presentationSubmissions: [] })
  }

  // The RPC call handles blocking non-organizers from accessing the list
  // and returns an empty list in that case.
  const { data, error } = await supabase.rpc('get_reviewable_submissions', {
    target_year
  })

  if (error) throw error

  const presentationSubmissions: PresentationReviewInfo[] = data.map((d) => {
    return {
      ...d,
      submitter: d.presenters.filter((p) => p.id === d.submitter_id)[0]
    }
  })

  return NextResponse.json({ presentationSubmissions })
}
