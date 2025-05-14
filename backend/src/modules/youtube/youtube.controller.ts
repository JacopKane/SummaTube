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

    return this.youtubeService.getUserFeed(token);
  }
}
