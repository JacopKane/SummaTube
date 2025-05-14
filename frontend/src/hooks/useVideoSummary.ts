import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface VideoSummaryResponse {
  videoId: string;
  summary: string;
}

export const useVideoSummary = (videoId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["summary", videoId],
    queryFn: async (): Promise<string> => {
      const token = localStorage.getItem("youtube_token");
      if (!token) throw new Error("Not authenticated");

      const response = await axios.get<VideoSummaryResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/summary/${videoId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.summary;
    },
    enabled: !!videoId && enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
