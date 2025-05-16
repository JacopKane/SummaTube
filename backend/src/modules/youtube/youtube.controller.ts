import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { YoutubeService } from "./youtube.service";
import { AuthService } from "../auth/auth.service";

@Controller("youtube")
export class YoutubeController {
  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly authService: AuthService
  ) {}

  @Get("feed")
  async getUserFeed(@Req() req: Request): Promise<
    {
      id: string;
      title: string;
      thumbnail: string;
      publishedAt: string;
      content: string | null;
      summaryStatus: string;
      videoUrl: string;
    }[]
  > {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("No valid token provided");
    }

    const token = authHeader.split(" ")[1];
    const tokenPayload = await this.authService.validateToken(token);

    if (!tokenPayload) {
      throw new UnauthorizedException("Invalid token");
    }

    try {
      return await this.youtubeService.getUserFeed(token);
    } catch (error) {
      // Check specifically for quota errors
      if (
        error?.response?.status === 403 &&
        error?.errors?.[0]?.reason === "quotaExceeded"
      ) {
        throw new UnauthorizedException(
          "YouTube API quota has been exceeded. Please try again later (quotas typically reset at midnight Pacific Time)."
        );
      }
      throw error;
    }
  }
}
