import { PresentationReviewInfo } from "@/Components/SubmittedPresentationReviewCard"
import { createServerClient_UserRLS } from "@/lib/supabaseClient"
import type { NextApiHandler } from "next"

const handler: NextApiHandler<{presentationSubmissions: Array<PresentationReviewInfo>}> = async (req, res) => {
  const {year: targetYear} = req.query as { year: string }

  // 2021 presentations were last updated on 2022-04-23 (when they were imported)
  // Month is 0-based for JS Dates, but day is as on a calendar (e.g. 1-31ish)
  const startCutoff_2021 = new Date(2021, 6, 1) // 1st July, 2021
  const endCutoff_2021 = new Date(2022, 3, 25) // 25th April, 2022
  const startCutoff_2022 = new Date(2022, 6, 1) // 1st July, 2022
  const endCutoff_2022 = new Date(2022, 10, 15) // 15th November, 2022

  const availableYears: {[key: string]: { start: Date, end: Date}} = {
    '2021': {
      start: startCutoff_2021,
      end: endCutoff_2021
    }, '2022': {
      start: startCutoff_2022,
      end: endCutoff_2022
    }
  }

  if (typeof availableYears[targetYear] === 'undefined') {
    return res.json({presentationSubmissions: []})
  }
  const { start, end } = availableYears[targetYear]

  const supabase = createServerClient_UserRLS(req, res)
  const { data, error } = await supabase
    .from('presentation_submissions')
    .select('*, profiles!presentation_presenters (id, firstname, lastname)')
    .eq('is_submitted', true)
  if (error) throw error;
  console.log("Data!!")
  // console.log(data)

  const presentationSubmissions: PresentationReviewInfo[] = data.filter((d) => {
    const updatedAt = new Date(d.updated_at)
    return updatedAt > start && updatedAt < end
  }).map((d) => {
    // console.log(d)
    const { title, abstract, presentation_type, submitter_id, updated_at } = d
    console.log({m: 'attempt for profiles', p: d.profiles, d}) //, presenter_email_lookup (email) e: d.presenter_email_lookup
    const presenters = (d.profiles as [{ id: string, firstname: string, lastname: string }])

    return {
      title,
      abstract,
      presentation_type,
      learning_points: d.learning_points ?? '',
      presentation_id: d.id,
      submitter: presenters.filter(p => p.id === submitter_id)[0],
      presenters,
      updated_at: updated_at
    }
  })
  return res.json({presentationSubmissions})
}

export default handler