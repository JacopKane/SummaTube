import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Use separate environment variable for server-side redirects
  // This allows us to use the external URL for browser redirects
  const apiUrl =
    process.env.EXTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8001/api";

  // Check if this is a reauthorization request
  const reauth = req.query.reauth === "true";

  // Forward the reauth parameter if present
  res.redirect(`${apiUrl}/auth/youtube${reauth ? "?reauth=true" : ""}`);
}
