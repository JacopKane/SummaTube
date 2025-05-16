import { useQuery } from "@tanstack/react-query";
import { ApiError, handleApiError } from "@/utils/errorHandling";
import api from "@/utils/api";

interface VideoSummaryResponse {
  videoId: string;
  summary: string;
}

export const useVideoSummary = (videoId: string, enabled: boolean = true) => {
  return useQuery<string, ApiError>({
    queryKey: ["summary", videoId],
    queryFn: async (): Promise<string> => {
      try {
        if (!videoId) throw new Error("No video ID provided");

        // Use our API client which automatically adds the token
        const response = await api.get<VideoSummaryResponse>(
          `/summary/${videoId}`
        );
        return response.data.summary;
      } catch (error) {
        console.error(`Error fetching summary for video ${videoId}:`, error);

        // Make sure we return an ApiError
        if (
          error &&
          typeof error === "object" &&
          ("isQuotaError" in error || "isPermissionError" in error)
        ) {
          throw error as ApiError;
        } else {
          throw handleApiError(error);
        }
      }
    },
    enabled: !!videoId && enabled,
    retry: 1,
    refetchOnWindowFocus: false,
    // Stale time to reduce API calls
    staleTime: 1000 * 60 * 30, // 30 minutes
    // Cache time to keep data in cache even when not used
    gcTime: 1000 * 60 * 60, // 60 minutes (newer version uses gcTime instead of cacheTime)
  });
};
