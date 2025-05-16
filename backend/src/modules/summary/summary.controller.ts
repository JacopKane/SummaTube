import {
  Controller,
  Get,
  Param,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { SummaryService } from "./summary.service";
import { AuthService } from "../auth/auth.service";

@Controller("summary")
export class SummaryController {
  constructor(
    private readonly summaryService: SummaryService,
    private readonly authService: AuthService
  ) {}

  @Get(":videoId")
  async getSummary(@Param("videoId") videoId: string, @Req() req: Request) {
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
      const summary = await this.summaryService.generateVideoSummary(
        videoId,
        token
      );
      return { videoId, summary };
    } catch (error) {
      // Handle different types of errors differently
      if (error.message && error.message.includes("Insufficient permissions")) {
        throw new UnauthorizedException({
          message: "Insufficient YouTube API permissions to access captions",
          isPermissionError: true,
        });
      } else if (
        error.message &&
        error.message.includes("not publicly accessible")
      ) {
        // This is not a permissions issue, just a video with closed captions
        throw new UnauthorizedException({
          message: "This video's captions are not publicly accessible",
          isPermissionError: false,
          isCaptionsNotAvailable: true,
        });
      }
      throw error; // Re-throw other errors
    }
  }
}
