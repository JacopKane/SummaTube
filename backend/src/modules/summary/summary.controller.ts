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
      // Check if token has the necessary scopes for caption access
      const hasCaptionsScope = await this.authService.hasCaptionsAccessScope(
        token
      );

      if (!hasCaptionsScope) {
        console.warn(
          "Token lacks sufficient caption access scopes, but will try anyway with fallbacks"
        );
        // We'll continue and try to use fallback mechanisms rather than failing immediately
        // This way, even if we lack perfect permissions, we'll try the fallbacks
      }

      const summary = await this.summaryService.generateVideoSummary(
        videoId,
        token
      );
      return { videoId, summary };
    } catch (error) {
      // Handle different types of errors differently
      if (
        error.isPermissionError ||
        (error.message && error.message.includes("Insufficient permissions"))
      ) {
        console.error("Permission error accessing captions:", error.message);
        // Return a detailed error with explicit permission error flag
        throw new UnauthorizedException({
          message:
            "Insufficient YouTube API permissions to access captions. Please reauthorize your account with expanded permissions.",
          isPermissionError: true,
          detail:
            "Caption access requires full YouTube API authorization. Click the reauthorize button to grant all necessary permissions.",
        });
      } else if (
        error.message &&
        (error.message.includes("not publicly accessible") ||
          error.message.includes("No captions available") ||
          error.message.includes("All caption approaches failed"))
      ) {
        // This is not a permissions issue, just a video with unavailable captions
        console.error("Captions not available error:", error.message);
        throw new UnauthorizedException({
          message:
            "This video's captions are not available or not publicly accessible",
          isPermissionError: false,
          isCaptionsNotAvailable: true,
        });
      } else if (error.message && error.message.includes("No captions found")) {
        // No captions found for this video
        console.error("No captions found:", error.message);
        throw new UnauthorizedException({
          message: "No captions found for this video",
          isPermissionError: false,
          isCaptionsNotAvailable: true,
        });
      }
      throw error; // Re-throw other errors
    }
  }
}
