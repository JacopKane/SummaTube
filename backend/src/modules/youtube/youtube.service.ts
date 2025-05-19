import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { google, youtube_v3 } from "googleapis";

export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  content: string | null;
  summaryStatus: "loading" | "completed" | "error";
  videoUrl: string;
}

@Injectable()
export class YoutubeService {
  private youtube: youtube_v3.Youtube;
  private feedCache: Map<string, { data: any; timestamp: number }> = new Map();
  private captionCache: Map<string, { data: string; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  constructor(private configService: ConfigService) {
    this.youtube = google.youtube({
      version: "v3",
    });
  }

  async getUserFeed(accessToken: string): Promise<VideoItem[]> {
    try {
      // Check if we have a cached response for this user
      const cachedData = this.feedCache.get(accessToken);
      const now = Date.now();

      if (cachedData && now - cachedData.timestamp < this.CACHE_TTL) {
        console.log("Returning cached feed data");
        return cachedData.data;
      }

      console.log("Cache miss for feed, fetching from YouTube API");
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Get subscriptions for the authenticated user
      const subscriptions = await this.youtube.subscriptions.list({
        auth,
        part: ["snippet"],
        mine: true,
        maxResults: 50,
      });

      const channelIds =
        subscriptions.data.items
          ?.map((item) => item.snippet?.resourceId?.channelId)
          .filter(Boolean) || [];

      const videos: VideoItem[] = [];

      // For each channel, get the latest videos
      // Reduce from 5 to 3 channels to save quota
      for (const channelId of channelIds.slice(0, 3)) {
        // Limit to 3 channels for quota optimization
        const channelVideos = await this.youtube.search.list({
          auth,
          part: ["snippet"],
          channelId: channelId || "",
          maxResults: 3, // Reduce from 5 to 3 videos per channel
          order: "date",
          type: ["video"],
        });

        channelVideos.data.items?.forEach((item: any) => {
          if (item.id.videoId) {
            videos.push({
              id: item.id.videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails.high.url,
              publishedAt: item.snippet.publishedAt,
              content: null,
              summaryStatus: "loading",
              videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            });
          }
        });
      }

      // Sort by publishedAt (newest first)
      const sortedVideos = videos.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      // Store in cache
      this.feedCache.set(accessToken, {
        data: sortedVideos,
        timestamp: Date.now(),
      });

      return sortedVideos;
    } catch (error) {
      console.error("Error fetching YouTube feed:", error);

      if (this.isQuotaExceededError(error)) {
        throw new UnauthorizedException(
          "YouTube API quota has been exceeded. Please try again later (quotas typically reset at midnight Pacific Time)."
        );
      } else if (error.response?.status === 403) {
        throw new UnauthorizedException(
          "Insufficient permissions to access YouTube feed. Please ensure you have the required YouTube API scopes."
        );
      } else if (error.response) {
        throw new UnauthorizedException(
          `Failed to fetch YouTube feed: ${
            error.response.data?.error?.message || error.message
          }`
        );
      } else {
        throw new UnauthorizedException(
          `Failed to fetch YouTube feed: ${error.message || "Unknown error"}`
        );
      }
    }
  }

  async getVideoTranscript(
    videoId: string,
    accessToken: string
  ): Promise<string> {
    // Create a cache key that includes the videoId
    const cacheKey = `${videoId}_${accessToken}`;
    const cachedData = this.captionCache.get(cacheKey);
    const now = Date.now();

    if (cachedData && now - cachedData.timestamp < this.CACHE_TTL) {
      console.log(`Returning cached caption data for video ${videoId}`);
      return cachedData.data;
    }

    console.log(`Cache miss for caption ${videoId}, fetching from YouTube API`);

    // Use the quota-aware cache method to handle potential quota errors
    return this.getFromCacheOnQuotaExceeded(
      cacheKey,
      async () => {
        try {
          const auth = new google.auth.OAuth2();
          auth.setCredentials({ access_token: accessToken });

          // Get captions for the video
          const captions = await this.youtube.captions.list({
            auth,
            part: ["snippet"],
            videoId,
          });

          if (!captions.data.items || captions.data.items.length === 0) {
            throw new Error("No captions found for this video");
          }

          // Preferably get English captions
          const captionTrack =
            captions.data.items?.find(
              (item) => item.snippet?.language === "en"
            ) || captions.data.items?.[0];

          if (!captionTrack) {
            throw new Error("No caption track found");
          }

          // Get the caption track
          // Use the tfmt parameter to get the transcript in SRT format
          const captionResponse = await this.youtube.captions.download({
            auth,
            id: captionTrack.id || "",
            tfmt: "srt", // Explicitly request SRT format
            tlang: "en", // Request English captions if available
            onBehalfOfContentOwner: "", // Add this parameter to help with partner permissions
          });

          // Parse the caption content (simplified)
          if (captionResponse.data) {
            const captionData = captionResponse.data.toString();

            // Store in cache
            const cacheKey = `${videoId}_${accessToken}`;
            this.captionCache.set(cacheKey, {
              data: captionData,
              timestamp: Date.now(),
            });

            return captionData;
          } else {
            throw new Error("Failed to download caption data");
          }
        } catch (error) {
          console.error("Error fetching transcript:", error);

          // Provide more specific error messages to help with debugging
          if (this.isQuotaExceededError(error)) {
            throw new Error(
              "YouTube API quota has been exceeded. Please try again later (quotas typically reset at midnight Pacific Time)."
            );
          } else if (
            error.response?.status === 403 ||
            error.response?.status === 401
          ) {
            const errorMessage = error.response?.data?.error?.message || "";
            const errorDetail = error.errors?.[0]?.message || "";
            const errorReason = error.errors?.[0]?.reason || "";

            console.log("Caption error details:", {
              status: error.response?.status,
              message: errorMessage,
              detail: errorDetail,
              reason: errorReason,
            });

            // Check for various permission error patterns
            if (
              errorMessage.includes("not sufficient") ||
              errorDetail.includes("not sufficient") ||
              errorDetail.includes("not properly authorized") ||
              errorMessage.includes("permission") ||
              errorDetail.includes("permission") ||
              errorReason === "forbidden"
            ) {
              console.log(
                "Detected caption permission issue. Attempting various fallback methods."
              );

              // This is a permissions issue - try an alternative approach with a direct request
              // First, attempt a retry with a different auth approach
              try {
                console.log(
                  `Attempting alternative caption access method for ${videoId}`
                );
                // Try to get captions with an explicit auth header
                const result = await this.getVideoCaptionsAlternative(
                  videoId,
                  accessToken
                );
                if (result) {
                  // Cache the result
                  const cacheKey = `${videoId}_${accessToken}`;
                  this.captionCache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now(),
                  });
                  return result;
                }
              } catch (altError) {
                console.error("Alternative caption method failed:", altError);
              }

              // No more description fallback - just throw the error
              throw new Error(
                "Insufficient permissions to access captions. Please ensure you have the required YouTube API scopes."
              );
            } else if (
              errorMessage.includes(
                "not have enabled third-party contributions"
              ) ||
              errorDetail.includes("not have enabled third-party contributions")
            ) {
              // This is a video where the owner has disabled third-party access to captions
              // No description fallback - just throw an error
              throw new Error(
                "Captions for this video are not publicly accessible. The video owner has not enabled third-party access to captions."
              );
            } else {
              // Generic 403 error
              throw new Error(
                `Failed to fetch video transcript: Access denied. ${
                  errorMessage || errorDetail || "Unknown reason"
                }`
              );
            }
          } else if (error.response) {
            throw new Error(
              `Failed to fetch video transcript: ${
                error.response.data?.error?.message || error.message
              }`
            );
          } else {
            throw new Error(
              `Failed to fetch video transcript: ${
                error.message || "Unknown error"
              }`
            );
          }
        }
      },
      this.captionCache, // Pass the cache instance
      null // Optional fallback value
    );
  }

  // Alternative method to get captions when the standard API fails
  async getVideoCaptionsAlternative(
    videoId: string,
    accessToken: string
  ): Promise<string | null> {
    try {
      console.log(
        `Using alternative caption access methods for video ${videoId}`
      );

      // First try to use the YouTube Data API with a different approach
      try {
        const auth = new google.auth.OAuth2(
          this.configService.get("YOUTUBE_CLIENT_ID"),
          this.configService.get("YOUTUBE_CLIENT_SECRET")
        );
        auth.setCredentials({ access_token: accessToken });

        const captions = await this.youtube.captions.list({
          auth,
          part: ["snippet", "id"],
          videoId,
        });

        if (captions.data.items && captions.data.items.length > 0) {
          // Get caption ID - preferably English
          const captionTrack =
            captions.data.items?.find(
              (item) => item.snippet?.language === "en"
            ) || captions.data.items?.[0];

          if (captionTrack && captionTrack.id) {
            // Try with alt parameter combinations
            try {
              console.log(
                `Attempting alternative download for caption ID ${captionTrack.id}`
              );
              const captionResponse = await this.youtube.captions.download({
                auth,
                id: captionTrack.id,
                tfmt: "sbv", // Try SubViewer format instead of SRT
                tlang: "en", // Request English captions
                onBehalfOfContentOwner: "", // Add this parameter for partner permissions
              });

              if (captionResponse.data) {
                return captionResponse.data.toString();
              }
            } catch (downloadErr) {
              console.error(
                "Alternative download format failed:",
                downloadErr.message
              );
            }

            // Try direct fetch with -d option
            const directFetchResult = await this.getDirectCaptionsWithDOption(
              videoId,
              captionTrack.id,
              accessToken
            );
            if (directFetchResult) {
              return directFetchResult;
            }
          }
        }
      } catch (apiError) {
        console.error(
          "Alternative YouTube API approach failed:",
          apiError.message
        );
      }

      // If API approaches fail, try the timedtext API for community captions
      // Note: This is an undocumented approach and may not always work
      return await this.getTimedTextCaptions(videoId);
    } catch (error) {
      console.error("Alternative caption fetching method failed:", error);
      return null;
    }
  }

  // Try a direct fetch with specific parameters for captions
  private async getDirectCaptionsWithDOption(
    videoId: string,
    captionId: string,
    accessToken: string
  ): Promise<string | null> {
    try {
      console.log(
        `Attempting direct captions fetch with -d option for ${videoId}`
      );

      // Try with various parameter combinations including the -d option for DOS line endings
      const attempts = [
        {
          url: `https://youtube.googleapis.com/youtube/v3/captions/${captionId}?tfmt=srt&tlang=en`,
          headers: { Authorization: `Bearer ${accessToken}` },
        },
        {
          url: `https://youtube.googleapis.com/youtube/v3/captions/${captionId}?tfmt=srt&tlang=en&prettyPrint=false`,
          headers: { Authorization: `Bearer ${accessToken}` },
        },
        {
          url: `https://youtube.googleapis.com/youtube/v3/captions/${captionId}?alt=media`,
          headers: { Authorization: `Bearer ${accessToken}` },
        },
        {
          url: `https://youtube.googleapis.com/youtube/v3/captions/${captionId}/download?tfmt=srt`,
          headers: { Authorization: `Bearer ${accessToken}` },
        },
        // Additional attempts with -d flag included
        {
          url: `https://www.googleapis.com/youtube/v3/captions/${captionId}?tfmt=srt&tlang=en&-d`,
          headers: { Authorization: `Bearer ${accessToken}` },
        },
        {
          url: `https://www.googleapis.com/youtube/v3/captions/${captionId}/download?tfmt=srt&-d`,
          headers: { Authorization: `Bearer ${accessToken}` },
        },
        {
          url: `https://www.googleapis.com/youtube/v3/captions/${captionId}/download?alt=media&-d`,
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      ];

      for (const attempt of attempts) {
        try {
          const response = await fetch(attempt.url, {
            headers: attempt.headers,
          });

          if (response.ok) {
            return await response.text();
          }
        } catch (err) {
          console.error(`Direct fetch attempt failed: ${err.message}`);
        }
      }

      return null;
    } catch (error) {
      console.error("Direct captions fetch failed:", error);
      return null;
    }
  }

  // Additional fallback using timedtext API
  private async getTimedTextCaptions(videoId: string): Promise<string | null> {
    try {
      console.log(`Attempting timedtext caption access for video ${videoId}`);

      // Try different formats and endpoints for YouTube's timedtext API
      const timedTextUrls = [
        `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`,
        `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=srv1`,
        `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=srv3`,
        `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&kind=asr`, // Auto-generated captions
        `https://www.youtube.com/api/timedtext?v=${videoId}`, // No language specified
      ];

      // Try each URL in sequence
      for (const url of timedTextUrls) {
        try {
          console.log(`Trying timedtext URL: ${url}`);
          const response = await fetch(url);

          if (response.ok) {
            const text = await response.text();
            if (
              text &&
              text.length > 0 &&
              !text.includes('<?xml version="1.0"')
            ) {
              // We have actual caption content, not just empty XML
              return text;
            }
          }
        } catch (urlError) {
          // Continue trying other URLs if one fails
          console.error(`Timedtext URL ${url} failed:`, urlError.message);
        }
      }

      // If all direct approaches fail, throw an error - no description fallback
      console.log(`All caption approaches failed for ${videoId}.`);
      throw new Error(`No captions available for video ${videoId}`);
    } catch (error) {
      console.error("Timed text fallback failed:", error);
      throw error; // Re-throw the error instead of returning null
    }
  }

  // Helper method to determine if an error is due to quota exceedance
  private isQuotaExceededError(error: any): boolean {
    if (!error) return false;

    // Check for errors array in the error object
    if (error.errors && Array.isArray(error.errors)) {
      const hasQuotaError = error.errors.some(
        (e: any) => e.reason === "quotaExceeded"
      );
      if (hasQuotaError) return true;
    }

    // Check for nested error object structure
    if (
      error.response &&
      error.response.data &&
      error.response.data.error &&
      error.response.data.error.errors &&
      Array.isArray(error.response.data.error.errors)
    ) {
      const hasQuotaError = error.response.data.error.errors.some(
        (e: any) => e.reason === "quotaExceeded"
      );
      if (hasQuotaError) return true;
    }

    // Check error message
    if (
      typeof error.message === "string" &&
      (error.message.includes("exceeded your quota") ||
        error.message.includes("quotaExceeded"))
    ) {
      return true;
    }

    return false;
  }

  // Add a method to try to get content from cache when quota is exceeded
  private async getFromCacheOnQuotaExceeded<T>(
    key: string,
    cachingFunction: () => Promise<T>,
    cache: Map<string, { data: T; timestamp: number }>,
    fallbackValue: T | null = null
  ): Promise<T> {
    try {
      return await cachingFunction();
    } catch (error) {
      // If quota exceeded, try to return cached data regardless of expiration
      if (this.isQuotaExceededError(error)) {
        console.log(
          `YouTube API quota exceeded! Checking for any cached data for key: ${key}`
        );
        const cachedData = cache.get(key);

        if (cachedData) {
          console.log(
            `Using expired cache as emergency fallback due to quota limits (key: ${key})`
          );
          return cachedData.data;
        } else {
          console.log(
            `No cache available for ${key}, quota error cannot be bypassed`
          );
          throw new Error(
            "YouTube API quota has been exceeded. Please try again later (quotas typically reset at midnight Pacific Time)."
          );
        }
      }

      // For other errors, just throw them
      throw error;
    }
  }

  /**
   * Fetch video description when transcripts/captions are unavailable
   * This serves as a fallback when captions cannot be accessed
   */
  async getVideoDescription(
    videoId: string,
    accessToken: string
  ): Promise<string> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Get video details including description
      const response = await this.youtube.videos.list({
        auth,
        part: ["snippet", "contentDetails"],
        id: [videoId],
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error("Video not found");
      }

      const video = response.data.items[0];
      const description = video.snippet?.description || "";
      const title = video.snippet?.title || "";
      const channelTitle = video.snippet?.channelTitle || "";
      const publishedAt = video.snippet?.publishedAt || "";
      const duration = video.contentDetails?.duration || "";

      // Format the content to provide context for summarization
      const formattedContent = `
Title: ${title}
Channel: ${channelTitle}
Published: ${publishedAt}
Duration: ${duration}
Description:
${description}
`.trim();

      return formattedContent;
    } catch (error) {
      console.error("Error fetching video description:", error);

      if (this.isQuotaExceededError(error)) {
        throw new Error(
          "YouTube API quota has been exceeded. Please try again later."
        );
      }

      throw new Error(
        `Failed to fetch video description: ${error.message || "Unknown error"}`
      );
    }
  }
}
