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
    try {
      // Create a cache key that includes the videoId
      const cacheKey = `${videoId}_${accessToken}`;
      const cachedData = this.captionCache.get(cacheKey);
      const now = Date.now();

      if (cachedData && now - cachedData.timestamp < this.CACHE_TTL) {
        console.log(`Returning cached caption data for video ${videoId}`);
        return cachedData.data;
      }

      console.log(
        `Cache miss for caption ${videoId}, fetching from YouTube API`
      );
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
        captions.data.items?.find((item) => item.snippet?.language === "en") ||
        captions.data.items?.[0];

      if (!captionTrack) {
        throw new Error("No caption track found");
      }

      // Get the caption track
      const captionResponse = await this.youtube.captions.download({
        auth,
        id: captionTrack.id || "",
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
      } else if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.error?.message || "";
        const errorDetail = error.errors?.[0]?.message || "";

        // Check if this is truly a permissions issue or if captions are simply not available
        if (
          errorMessage.includes("not sufficient") ||
          errorDetail.includes("not sufficient") ||
          errorDetail.includes("not properly authorized")
        ) {
          // This is a permissions issue
          throw new Error(
            "Insufficient permissions to access captions. Please ensure you have the required YouTube API scopes."
          );
        } else if (
          errorMessage.includes("not have enabled third-party contributions") ||
          errorDetail.includes("not have enabled third-party contributions")
        ) {
          // This is a video where the owner has disabled third-party access to captions
          // Try to get video description as a fallback
          try {
            console.log(
              `Attempting to use video description as fallback for ${videoId}`
            );
            const description = await this.getVideoDescription(
              videoId,
              accessToken
            );

            // Cache the description as if it were captions
            const cacheKey = `${videoId}_${accessToken}`;
            this.captionCache.set(cacheKey, {
              data: description,
              timestamp: Date.now(),
            });

            return description;
          } catch (descError) {
            console.error("Fallback to description failed:", descError);
            throw new Error(
              "Captions for this video are not publicly accessible. The video owner has not enabled third-party access to captions."
            );
          }
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
  }

  // Helper method to determine if an error is due to quota exceedance
  private isQuotaExceededError(error: any): boolean {
    return (
      error?.response?.status === 403 &&
      error?.errors?.[0]?.reason === "quotaExceeded"
    );
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
