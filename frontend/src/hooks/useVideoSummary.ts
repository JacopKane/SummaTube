import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ApiError, handleApiError } from "@/utils/errorHandling";
import api from "@/utils/api";
import {
  isCacheValid,
  getCacheSettings,
  cleanupCache,
  incrementQuotaUsage,
  isApproachingQuotaLimit,
} from "@/utils/cacheManager";

interface VideoSummaryResponse {
  videoId: string;
  summary: string;
}

interface CachedSummary {
  summary: string;
  timestamp: number;
  source?: "cache" | "api";
}

export const useVideoSummary = (videoId: string, enabled: boolean = true) => {
  const [summaryData, setSummaryData] = useState<CachedSummary | null>(null);
  const [isFetchingFromApi, setIsFetchingFromApi] = useState(false);

  // First check for cached summary in localStorage
  const getCachedSummary = (): CachedSummary | null => {
    if (!videoId) return null;
    try {
      const cachedSummaries = localStorage.getItem("cached_summaries");
      if (cachedSummaries) {
        const summariesObj = JSON.parse(cachedSummaries);
        if (summariesObj[videoId] && summariesObj[videoId].summary) {
          const cachedData = summariesObj[videoId];

          // Check if the cached data is still valid according to settings
          if (
            cachedData.timestamp &&
            isCacheValid(cachedData.timestamp, "summary")
          ) {
            console.log(`Using cached summary for video ${videoId}`);
            return {
              ...cachedData,
              source: "cache",
            };
          } else {
            console.log(`Cached summary for video ${videoId} expired`);
          }
        }
      }
      return null;
    } catch (e) {
      console.error("Error retrieving cached summary:", e);
      return null;
    }
  };

  // Store summary in localStorage cache
  const cacheSummary = (summary: string): CachedSummary => {
    if (!videoId) throw new Error("Cannot cache: No video ID provided");

    try {
      const cachedSummaries = localStorage.getItem("cached_summaries");
      const summariesObj = cachedSummaries ? JSON.parse(cachedSummaries) : {};

      const cachedData: CachedSummary = {
        summary,
        timestamp: Date.now(),
        source: "api",
      };

      summariesObj[videoId] = cachedData;
      localStorage.setItem("cached_summaries", JSON.stringify(summariesObj));

      return cachedData;
    } catch (e) {
      console.error("Error caching summary:", e);
      throw e;
    }
  };

  // Load cached data on mount
  useEffect(() => {
    if (videoId) {
      // Clean up any expired cache based on settings
      cleanupCache();

      // Check if we have cached data
      const cached = getCachedSummary();
      if (cached) {
        setSummaryData(cached);
      }
    }
  }, [videoId]);

  // Check if we should use cached data based on settings
  const settings = getCacheSettings();
  const preferCache = settings.preferCache;

  // Check if we already have a valid cached summary
  const hasCachedSummary = !!summaryData && summaryData.source === "cache";
  const useCachedData = hasCachedSummary && preferCache;

  const query = useQuery<CachedSummary, ApiError>({
    queryKey: ["summary", videoId],
    queryFn: async (): Promise<CachedSummary> => {
      try {
        // If we have a cached summary and settings say to use it, return it
        if (summaryData && preferCache) {
          return summaryData;
        }

        if (!videoId) throw new Error("No video ID provided");

        // If we're approaching quota limit, don't make the request unless forced
        if (
          isApproachingQuotaLimit() &&
          !window.confirm(
            "You are approaching the YouTube API quota limit. Continue with this request?"
          )
        ) {
          throw new ApiError(
            "Cancelled request to conserve quota",
            429,
            true,
            false,
            false
          );
        }

        // Flag that we're fetching from API for UI indicators
        setIsFetchingFromApi(true);

        // Use our API client which automatically adds the token
        const response = await api.get<VideoSummaryResponse>(
          `/summary/${videoId}`
        );

        // Update quota usage counter
        incrementQuotaUsage(2); // Summary costs more API units

        // Cache the summary for future use
        const newCachedData = cacheSummary(response.data.summary);
        setSummaryData(newCachedData);

        return newCachedData;
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
      } finally {
        setIsFetchingFromApi(false);
      }
    },
    enabled: !!videoId && enabled && !useCachedData, // Only fetch if we don't have cached data
    retry: 0, // Don't retry to minimize API calls
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    // Stale time to reduce API calls - set to 7 days
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    // Cache time to keep data in cache even when not used
    gcTime: 1000 * 60 * 60 * 24 * 30, // 30 days (newer version uses gcTime instead of cacheTime)
  });

  // Return a simplified interface that matches the original hook
  return {
    ...query,
    data: query.data?.summary || summaryData?.summary,
    dataSource: query.data?.source || summaryData?.source,
    timestamp: query.data?.timestamp || summaryData?.timestamp,
    isFetchingFromApi,
  };
};
