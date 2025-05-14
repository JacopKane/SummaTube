import { Injectable } from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";
import { ConfigService } from "@nestjs/config";
import fetch from "node-fetch";

@Injectable()
export class AuthService {
  private oauth2Client: OAuth2Client;

  constructor(private configService: ConfigService) {
    this.oauth2Client = new OAuth2Client(
      this.configService.get("YOUTUBE_CLIENT_ID"),
      this.configService.get("YOUTUBE_CLIENT_SECRET"),
      this.configService.get("YOUTUBE_CALLBACK_URL")
    );
  }

  generateAuthUrl(): string {
    const scopes = [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/youtubepartner",
      "https://www.googleapis.com/auth/youtube.force-ssl",
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      include_granted_scopes: true,
    });
  }

  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async validateToken(token: string) {
    try {
      // For access tokens, we need to validate by making a request to Google's tokeninfo endpoint
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
      );

      if (response.status !== 200) {
        console.error("Token validation failed:", await response.text());
        return null;
      }

      const data: any = await response.json();

      // Check if the token is for our app
      if (data.audience !== this.configService.get("YOUTUBE_CLIENT_ID")) {
        console.error("Token was issued for a different client ID");
        return null;
      }

      return data;
    } catch (error) {
      console.error("Token validation error:", error);
      return null;
    }
  }
}
