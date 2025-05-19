import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { YoutubeService } from "../youtube/youtube.service";
import * as fs from "fs";
import * as path from "path";

interface SummaryResponse {
  summary: string;
}

@Injectable()
export class SummaryService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(SummaryService.name);
  private readonly maxTokensPerSummarization: number;
  private readonly model: string;
  private readonly summaryCache: Map<
    string,
    { summary: string; timestamp: number }
  > = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor(
    private configService: ConfigService,
    private youtubeService: YoutubeService
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>("OPENAI_API_KEY"),
    });
    this.maxTokensPerSummarization =
      this.configService.get<number>("MAX_TOKENS_PER_SUMMARIZATION") || 2000;
    this.model = this.configService.get<string>("OPENAI_MODEL") || "gpt-4";
  }

  async generateVideoSummary(
    videoId: string,
    accessToken: string
  ): Promise<string> {
    try {
      // First, check if we have a cached summary to handle quota errors gracefully
      const summaryCacheKey = `summary_${videoId}`;
      const cachedSummary = this.getCachedSummary(summaryCacheKey);
      if (cachedSummary) {
        this.logger.log(
          `Using cached summary for video ${videoId} to avoid API quota issues`
        );
        return cachedSummary;
      }

      // Fetch the video transcript or fallback to description
      let content: string;
      try {
        content = await this.youtubeService.getVideoTranscript(
          videoId,
          accessToken
        );

        if (!content) {
          // Before giving up, check for an expired cache entry that might be usable
          const expiredCacheSummary = this.getCachedSummary(
            summaryCacheKey,
            true
          );
          if (expiredCacheSummary) {
            this.logger.log(
              `No content available but using expired cached summary for video ${videoId}`
            );
            return (
              expiredCacheSummary +
              "\n\n(Note: This is an older cached summary. New content could not be retrieved.)"
            );
          }
          throw new Error("No content available for this video");
        }
      } catch (transcriptError: any) {
        // If there's an error getting the transcript, check for cached summary first
        if (
          transcriptError.message &&
          transcriptError.message.includes("YouTube API quota")
        ) {
          const expiredCacheSummary = this.getCachedSummary(
            summaryCacheKey,
            true
          );
          if (expiredCacheSummary) {
            this.logger.log(
              `Transcript fetch failed due to quota limits, using cached summary for ${videoId}`
            );
            return (
              expiredCacheSummary +
              "\n\n(Note: This is a cached summary. Fresh data could not be retrieved due to YouTube API quota limitations.)"
            );
          }
        }
        // If no cache is available, rethrow the error
        throw transcriptError;
      }

      // Generate summary from transcript content
      const summary = await this.iterativeSummarization(content, "transcript");

      // Cache the summary for future quota error handling
      this.cacheSummary(summaryCacheKey, summary);

      return summary;
    } catch (error: any) {
      this.logger.error(
        `Error generating summary for video ${videoId}:`,
        error
      );

      // Try to get cached summary if available, even if it's expired
      const summaryCacheKey = `summary_${videoId}`;
      const cachedSummary = this.getCachedSummary(summaryCacheKey, true);
      if (cachedSummary) {
        this.logger.log(
          `Falling back to cached summary for video ${videoId} after error`
        );
        return (
          cachedSummary +
          "\n\n(Note: This is a cached summary. Fresh data could not be retrieved due to API limitations.)"
        );
      }

      // Extract any error message for better error handling
      const errorMessage = error.message || "";
      const errorDetails = error.response?.data?.error?.message || "";

      // Pass through specific error messages from YouTube API
      if (
        errorMessage.includes("YouTube API quota") ||
        errorDetails.includes("quota")
      ) {
        // Try to get cached summary if available, even if it's expired
        const summaryCacheKey = `summary_${videoId}`;
        const cachedSummary = this.getCachedSummary(summaryCacheKey, true);
        if (cachedSummary) {
          this.logger.log(
            `Using cached summary for video ${videoId} due to quota limits`
          );
          return (
            cachedSummary +
            "\n\n(Note: This is a cached summary. Fresh data could not be retrieved due to YouTube API quota limitations.)"
          );
        }
        throw new Error(
          "YouTube API quota exceeded. Please try again later. Quotas typically reset at midnight Pacific Time."
        );
      } else if (
        errorMessage.includes("permissions") ||
        errorDetails.includes("permissions") ||
        errorDetails.includes("authorized")
      ) {
        throw new Error(
          "Insufficient permissions to access video content. The video may be private or require special access."
        );
      } else if (
        errorMessage.includes("No captions found") ||
        errorMessage.includes("No content available")
      ) {
        throw new Error(
          "No captions or transcript available for this video. Some creators don't provide captions."
        );
      } else if (
        errorMessage.includes("OpenAI") ||
        errorMessage.includes("Failed to get summary")
      ) {
        throw new Error(
          "There was an issue generating the summary. Please try again later."
        );
      } else {
        throw new Error(
          "Failed to generate video summary: " +
            (errorMessage || "Unknown error")
        );
      }
    }
  }

  private async iterativeSummarization(
    content: string,
    contentType: string = "transcript"
  ): Promise<string> {
    // If the content is short enough, summarize it directly
    if (content.length < this.maxTokensPerSummarization * 4) {
      // Rough estimation
      return this.summarizeContent(content, contentType);
    }

    // Split the content into chunks and summarize each chunk
    const chunks = this.splitText(content, this.maxTokensPerSummarization * 4);
    let partialSummaries: string[] = [];

    for (const chunk of chunks) {
      const summary = await this.summarizeContent(chunk, contentType);
      partialSummaries.push(summary);
    }

    // If we still have multiple summaries, recursively summarize them
    while (partialSummaries.length > 1) {
      const combinedText = partialSummaries.join("\n\n");

      if (combinedText.length < this.maxTokensPerSummarization * 4) {
        return this.summarizeContent(combinedText, contentType);
      }

      // Process the partial summaries in batches
      const newPartialSummaries: string[] = [];
      const batchSize = 3; // Number of summaries to combine in one batch

      for (let i = 0; i < partialSummaries.length; i += batchSize) {
        const batch = partialSummaries.slice(i, i + batchSize);
        const batchText = batch.join("\n\n");
        const batchSummary = await this.summarizeContent(
          batchText,
          contentType
        );
        newPartialSummaries.push(batchSummary);
      }

      partialSummaries = newPartialSummaries;
    }

    return partialSummaries[0];
  }

  private async summarizeContent(
    content: string,
    contentType: string = "transcript"
  ): Promise<string> {
    try {
      // We only handle transcripts now, no more descriptions
      const systemPrompt =
        "You are an expert at summarizing video transcripts. Extract key points and main ideas concisely. Your response MUST be in JSON format with a 'summary' field containing the summarized content.";

      // User prompt for transcript summarization
      const userPrompt = `Summarize the following transcript in a clear, concise manner. Focus on the main points and key takeaways. Return your response as a valid JSON object with a 'summary' field that contains the text of your summary:\n\n${content}\n\nRemember to respond with only a JSON object in this format: {"summary": "your summary text here"}`;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        response_format: {
          type: "json_object",
        },
      });

      const messageContent = completion.choices[0].message.content;
      if (messageContent) {
        try {
          const response = JSON.parse(messageContent) as SummaryResponse;
          if (response && response.summary) {
            return response.summary;
          } else {
            this.logger.warn(
              "OpenAI response missing summary field:",
              messageContent
            );
            return "Could not extract summary from API response. The response format was incorrect.";
          }
        } catch (parseError) {
          this.logger.error("Error parsing OpenAI JSON response:", parseError);
          this.logger.warn("Raw response content:", messageContent);
          return "Could not parse summary from API response. The response was not valid JSON.";
        }
      }
      throw new Error("Failed to get summary content from OpenAI");
    } catch (error: any) {
      this.logger.error("Error summarizing content with OpenAI:", error);

      // Handle specific OpenAI API errors
      if (error.response?.status === 400) {
        this.logger.warn("OpenAI API 400 error details:", error.response?.data);
        throw new Error(
          "There was an issue with the OpenAI request format. Please check the API configuration."
        );
      } else if (error.response?.status === 401) {
        throw new Error(
          "Authentication with OpenAI API failed. Please check your API key configuration."
        );
      } else if (error.response?.status === 429) {
        throw new Error(
          "OpenAI API rate limit exceeded. Please try again later."
        );
      }

      throw error;
    }
  }

  private splitText(text: string, maxChunkSize: number): string[] {
    const chunks: string[] = [];
    let currentChunk = "";

    // Split by paragraphs or lines
    const paragraphs = text.split(/\n\s*\n|\r\n\s*\r\n/);

    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length <= maxChunkSize) {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = paragraph;
        } else {
          // If a single paragraph is too long, we need to split it
          const sentences = paragraph.split(/(?<=[.!?])\s+/);
          let sentenceChunk = "";

          for (const sentence of sentences) {
            if ((sentenceChunk + sentence).length <= maxChunkSize) {
              sentenceChunk += (sentenceChunk ? " " : "") + sentence;
            } else {
              if (sentenceChunk) {
                chunks.push(sentenceChunk);
                sentenceChunk = sentence;
              } else {
                // If a single sentence is too long, just split arbitrarily
                chunks.push(sentence.substring(0, maxChunkSize));
              }
            }
          }

          if (sentenceChunk) {
            currentChunk = sentenceChunk;
          }
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  // Cache a summary
  private cacheSummary(key: string, summary: string): void {
    this.summaryCache.set(key, {
      summary,
      timestamp: Date.now(),
    });

    // Also try to persist to disk as backup
    try {
      const cacheDir = path.join(process.cwd(), "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(cacheDir, `${key}.json`),
        JSON.stringify({ summary, timestamp: Date.now() })
      );
    } catch (err) {
      this.logger.error("Failed to write summary cache to disk", err);
    }
  }

  // Get a cached summary
  private getCachedSummary(key: string, ignoreExpiry = false): string | null {
    // First check in-memory cache
    const cachedData = this.summaryCache.get(key);
    const now = Date.now();

    if (
      cachedData &&
      (ignoreExpiry || now - cachedData.timestamp < this.CACHE_TTL)
    ) {
      return cachedData.summary;
    }

    // Then check disk cache
    try {
      const cacheFile = path.join(process.cwd(), "cache", `${key}.json`);
      if (fs.existsSync(cacheFile)) {
        const data = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
        if (ignoreExpiry || now - data.timestamp < this.CACHE_TTL) {
          // Update in-memory cache
          this.summaryCache.set(key, {
            summary: data.summary,
            timestamp: data.timestamp,
          });
          return data.summary;
        }
      }
    } catch (err) {
      this.logger.error("Failed to read summary cache from disk", err);
    }

    return null;
  }
}
