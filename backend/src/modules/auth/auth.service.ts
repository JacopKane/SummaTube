import { Injectable } from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";
import { ConfigService } from "@nestjs/config";

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
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: token,
        audience: this.configService.get("YOUTUBE_CLIENT_ID"),
      });

      return ticket.getPayload();
    } catch (error) {
      return null;
    }
  }
}
