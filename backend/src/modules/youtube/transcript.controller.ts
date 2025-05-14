import {
  Controller,
  Get,
  Param,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { YoutubeService } from "./youtube.service";
import { AuthService } from "../auth/auth.service";

@Controller("transcripts")
export class TranscriptController {
  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly authService: AuthService
  ) {}

  @Get(":videoId")
  async getVideoTranscript(
    @Param("videoId") videoId: string,
    @Req() req: Request
  ): Promise<{ videoId: string; transcript: string }> {
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
      const transcript = await this.youtubeService.getVideoTranscript(
        videoId,
        token
      );
      return {
        videoId,
        transcript,
      };
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
