import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.query.secret !== process.env.PROFILE_REVALIDATION_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    await res.revalidate('/full-agenda');
    return res.json({ revalidated: true });
  } catch (error) {
    return res.status(500).send('Error revalidating');
  }
}
