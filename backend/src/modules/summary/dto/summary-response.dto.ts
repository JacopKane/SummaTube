import { ApiProperty } from "@nestjs/swagger";

export class SummaryResponseDto {
  @ApiProperty({ description: "YouTube video ID" })
  videoId: string;

  @ApiProperty({ description: "Generated summary of the video content" })
  summary: string;
}
