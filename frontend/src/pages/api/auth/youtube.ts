import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8001/api';
  res.redirect(`${apiUrl}/auth/youtube`);
}
