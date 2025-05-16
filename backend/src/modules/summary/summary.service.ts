import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { YoutubeService } from "../youtube/youtube.service";

interface SummaryResponse {
  summary: string;
}

@Injectable()
export class SummaryService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(SummaryService.name);
  private readonly maxTokensPerSummarization: number;
  private readonly model: string;

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
      // Fetch the video transcript or fallback to description
      const content = await this.youtubeService.getVideoTranscript(
        videoId,
        accessToken
      );

      if (!content) {
        throw new Error("No content available for this video");
      }

      // Check if this is likely a transcript or a description (from fallback)
      const isDescription =
        content.includes("Title:") &&
        content.includes("Channel:") &&
        content.includes("Published:") &&
        content.includes("Description:");

      // Generate summary, with modified prompt if it's a description
      return this.iterativeSummarization(
        content,
        isDescription ? "video description" : "transcript"
      );
    } catch (error) {
      this.logger.error(
        `Error generating summary for video ${videoId}:`,
        error
      );
      throw new Error("Failed to generate video summary");
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
      // Adjust the system prompt based on the content type
      const systemPrompt =
        contentType === "transcript"
          ? "You are an expert at summarizing video transcripts. Extract key points and main ideas concisely."
          : "You are an expert at extracting key information from video descriptions. Create a concise summary of what the video is about.";

      // Adjust the user prompt based on the content type
      const userPrompt =
        contentType === "transcript"
          ? `Summarize the following transcript in a clear, concise manner. Focus on the main points and key takeaways:\n\n${content}`
          : `Extract the key information from this video description and summarize what the video is likely about:\n\n${content}`;

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
        const response = JSON.parse(messageContent) as SummaryResponse;
        return response.summary;
      }
      throw new Error("Failed to get summary content from OpenAI");
    } catch (error) {
      this.logger.error("Error summarizing content with OpenAI:", error);
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
}
