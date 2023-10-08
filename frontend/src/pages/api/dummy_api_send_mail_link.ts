import type { NextApiHandler } from 'next';

// This is a dummy, only used by Playwright, that does nothing
const handler: NextApiHandler = async (req, res) => {
  res.status(500).end();
};

export default handler;
