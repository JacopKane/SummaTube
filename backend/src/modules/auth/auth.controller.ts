import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Get("youtube")
  async youtubeAuth(@Req() req: Request, @Res() res: Response) {
    // Check if this is a reauthorization request
    const reauth = req.query.reauth === "true";
    const authUrl = this.authService.generateAuthUrl(reauth);
    return res.redirect(authUrl);
  }

  @Get("youtube/callback")
  async youtubeCallback(@Req() req: Request, @Res() res: Response) {
    const code = req.query.code as string;

    if (!code) {
      console.error("No authorization code received from Google OAuth");
      return res.redirect(
        `${this.configService.get("FRONTEND_URL")}?error=auth_failed`
      );
    }

    try {
      const tokens = await this.authService.getTokens(code);

      // Validate that we received proper scopes in the token
      let missingScopes = false;
      if (tokens && tokens.access_token) {
        const tokenInfo = await this.authService.validateToken(
          tokens.access_token
        );
        const hasCaptionsAccess = await this.authService.hasCaptionsAccessScope(
          tokens.access_token
        );

        if (!hasCaptionsAccess) {
          console.warn("Received token doesn't have captions access scopes!");
          missingScopes = true;
        }
      }

      // When we get new tokens, add a flag to clear any permission errors
      // Redirect to frontend with the token and clear permission error flag
      return res.redirect(
        `${this.configService.get("FRONTEND_URL")}?token=${
          tokens.access_token
        }&clearPermissionError=true${missingScopes ? "&scopeWarning=true" : ""}`
      );
    } catch (error) {
      console.error("YouTube auth callback error:", error);
      return res.redirect(
        `${this.configService.get("FRONTEND_URL")}?error=auth_failed`
      );
    }
  }
}
