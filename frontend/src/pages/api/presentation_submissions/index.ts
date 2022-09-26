import type { NextApiHandler } from "next"

const handler: NextApiHandler = async (req, res) => {
  // Default to 'this' year
  const thisYearString = new Date().getUTCFullYear().toString()
  res.redirect('/api/presentation_submissions/' + thisYearString)
}

export default handler