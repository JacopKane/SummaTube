import { ApiProperty } from "@nestjs/swagger";

export class FeedItemDto {
  @ApiProperty({ description: "YouTube video ID" })
  id: string;

  @ApiProperty({ description: "Video title" })
  title: string;

  @ApiProperty({ description: "Thumbnail URL" })
  thumbnail: string;

  @ApiProperty({ description: "Video publish date" })
  publishedAt: string;

  @ApiProperty({ description: "Video content/transcript", nullable: true })
  content: string | null;

  @ApiProperty({
    description: "Summary generation status",
    example: "pending | completed | failed",
  })
  summaryStatus: string;

  @ApiProperty({ description: "YouTube video URL" })
  videoUrl: string;
}
