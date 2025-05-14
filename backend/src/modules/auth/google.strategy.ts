import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy, StrategyOptions } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
    constructor(private configService: ConfigService) {
        super({
            clientID: configService.get("YOUTUBE_CLIENT_ID"),
            clientSecret: configService.get("YOUTUBE_CLIENT_SECRET"),
            callbackURL: configService.get("YOUTUBE_CALLBACK_URL"),
            scope: [
                "https://www.googleapis.com/auth/youtube.readonly",
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ]
            // Don't include passReqToCallback for default behavior
        } as StrategyOptions);
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile) {
        const user = {
            googleId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            accessToken,
            refreshToken,
        };

        return user;
    }
}
