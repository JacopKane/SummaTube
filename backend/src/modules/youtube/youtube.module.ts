import { Module } from "@nestjs/common";
import { YoutubeController } from "./youtube.controller";
import { YoutubeService } from "./youtube.service";
import { AuthModule } from "../auth/auth.module";
import { TranscriptController } from "./transcript.controller";

@Module({
  imports: [AuthModule],
  controllers: [YoutubeController, TranscriptController],
  providers: [YoutubeService],
  exports: [YoutubeService],
})
export class YoutubeModule {}
