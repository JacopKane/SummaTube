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

    constructor(private configService: ConfigService) {
        this.youtube = google.youtube({
            version: "v3",
        });
    }

    async getUserFeed(accessToken: string): Promise<VideoItem[]> {
        try {
            const auth = new google.auth.OAuth2();
            auth.setCredentials({ access_token: accessToken });

            // Get subscriptions for the authenticated user
            const subscriptions = await this.youtube.subscriptions.list({
                auth,
                part: ["snippet"],
                mine: true,
                maxResults: 50,
            });

            const channelIds = subscriptions.data.items?.map(
                (item) => item.snippet?.resourceId?.channelId
            ).filter(Boolean) || [];

            const videos: VideoItem[] = [];

            // For each channel, get the latest videos
            for (const channelId of channelIds.slice(0, 5)) {
                // Limit to 5 channels for faster results
                const channelVideos = await this.youtube.search.list({
                    auth,
                    part: ["snippet"],
                    channelId: channelId || '',
                    maxResults: 5,
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
            return videos.sort(
                (a, b) =>
                    new Date(b.publishedAt).getTime() -
                    new Date(a.publishedAt).getTime()
            );
        } catch (error) {
            console.error("Error fetching YouTube feed:", error);
            throw new UnauthorizedException("Failed to fetch YouTube feed");
        }
    }

    async getVideoTranscript(
        videoId: string,
        accessToken: string
    ): Promise<string> {
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
            const captionResponse = await this.youtube.captions.download({
                auth,
                id: captionTrack.id || '',
            });

            // Parse the caption content (simplified)
            if (captionResponse.data) {
                return captionResponse.data.toString();
            } else {
                throw new Error("Failed to download caption data");
            }
        } catch (error) {
            console.error("Error fetching transcript:", error);
            throw new Error("Failed to fetch video transcript");
        }
    }
}
