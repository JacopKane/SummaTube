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
  async youtubeAuth(@Res() res: Response) {
    const authUrl = this.authService.generateAuthUrl();
    return res.redirect(authUrl);
  }

  @Get("youtube/callback")
  async youtubeCallback(@Req() req: Request, @Res() res: Response) {
    const code = req.query.code as string;

    if (!code) {
      return res.redirect(
        `${this.configService.get("FRONTEND_URL")}?error=auth_failed`
      );
    }

    try {
      const tokens = await this.authService.getTokens(code);

      // Redirect to frontend with the token
      return res.redirect(
        `${this.configService.get("FRONTEND_URL")}?token=${tokens.access_token}`
      );
    } catch (error) {
      console.error("YouTube auth callback error:", error);
      return res.redirect(
        `${this.configService.get("FRONTEND_URL")}?error=auth_failed`
      );
    }
  }
}
