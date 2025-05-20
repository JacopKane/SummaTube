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

  generateAuthUrl(reauth: boolean = false): string {
    const scopes = [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/youtube.force-ssl",
      "https://www.googleapis.com/auth/youtube", // Full access to YouTube features
      // Critical for caption access - needed for private/restricted videos
      "https://www.googleapis.com/auth/youtubepartner", // Partner access for captions
      "https://www.googleapis.com/auth/youtubepartner-channel-audit", // Additional partner access
    ];

    // When reauthorizing, we always want to force consent screen and include granted scopes
    // This ensures the user can grant any missing permissions
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      include_granted_scopes: true,
      // Force consent for reauthorization to ensure user sees all requested scopes
      prompt: reauth ? "consent" : "consent", // Always show consent to ensure all scopes are presented
      // Disable granular consent as it may cause scope fragmentation
      enable_granular_consent: false,
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

  /**
   * Check if a token has the necessary scopes for accessing captions
   * This can help identify when reauthorization is needed
   */
  async hasCaptionsAccessScope(token: string): Promise<boolean> {
    try {
      // Validate token and check scopes
      const tokenInfo = await this.validateToken(token);

      if (!tokenInfo || !tokenInfo.scope) {
        console.warn("Token has no scopes or is invalid");
        return false;
      }

      const scopes = tokenInfo.scope.split(" ");
      console.log("Token scopes:", scopes);

      // These are the scopes that can potentially provide captions access
      // Listed in order of preference/importance
      const captionScopes = [
        "https://www.googleapis.com/auth/youtube", // Full YouTube access (most reliable for captions)
        "https://www.googleapis.com/auth/youtubepartner", // Partner access for captions
        "https://www.googleapis.com/auth/youtubepartner-channel-audit", // Additional partner access
        "https://www.googleapis.com/auth/youtube.force-ssl", // More limited but can work for some captions
      ];

      // Check if token has any of the required scopes
      const hasRequiredScope = captionScopes.some((requiredScope) =>
        scopes.includes(requiredScope)
      );

      if (!hasRequiredScope) {
        console.warn(
          "Token lacks required caption access scopes. Available scopes:",
          scopes
        );
      }

      return hasRequiredScope;
    } catch (error) {
      console.error("Error checking caption scopes:", error);
      return false;
    }
  }
}
