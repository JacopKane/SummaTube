import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Use separate environment variable for server-side redirects
  // This allows us to use the external URL for browser redirects
  const apiUrl = process.env.EXTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";
  res.redirect(`${apiUrl}/auth/youtube`);
}
