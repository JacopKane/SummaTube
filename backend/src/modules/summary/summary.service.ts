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
      // Fetch the video transcript
      const transcript = await this.youtubeService.getVideoTranscript(
        videoId,
        accessToken
      );

      if (!transcript) {
        throw new Error("No transcript available for this video");
      }

      // Generate summary through iterative summarization
      return this.iterativeSummarization(transcript);
    } catch (error) {
      this.logger.error(
        `Error generating summary for video ${videoId}:`,
        error
      );
      throw new Error("Failed to generate video summary");
    }
  }

  private async iterativeSummarization(transcript: string): Promise<string> {
    // If the transcript is short enough, summarize it directly
    if (transcript.length < this.maxTokensPerSummarization * 4) {
      // Rough estimation
      return this.summarizeContent(transcript);
    }

    // Split the transcript into chunks and summarize each chunk
    const chunks = this.splitText(
      transcript,
      this.maxTokensPerSummarization * 4
    );
    let partialSummaries: string[] = [];

    for (const chunk of chunks) {
      const summary = await this.summarizeContent(chunk);
      partialSummaries.push(summary);
    }

    // If we still have multiple summaries, recursively summarize them
    while (partialSummaries.length > 1) {
      const combinedText = partialSummaries.join("\n\n");

      if (combinedText.length < this.maxTokensPerSummarization * 4) {
        return this.summarizeContent(combinedText);
      }

      // Process the partial summaries in batches
      const newPartialSummaries: string[] = [];
      const batchSize = 3; // Number of summaries to combine in one batch

      for (let i = 0; i < partialSummaries.length; i += batchSize) {
        const batch = partialSummaries.slice(i, i + batchSize);
        const batchText = batch.join("\n\n");
        const batchSummary = await this.summarizeContent(batchText);
        newPartialSummaries.push(batchSummary);
      }

      partialSummaries = newPartialSummaries;
    }

    return partialSummaries[0];
  }

  private async summarizeContent(transcriptContent: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert at summarizing video transcripts. Extract key points and main ideas concisely.",
          },
          {
            role: "user",
            content: `Summarize the following transcript in a clear, concise manner. Focus on the main points and key takeaways:\n\n${transcriptContent}`,
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
