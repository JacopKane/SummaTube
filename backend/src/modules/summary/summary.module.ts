import { Module } from '@nestjs/common';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';
import { YoutubeModule } from '../youtube/youtube.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [YoutubeModule, AuthModule],
  controllers: [SummaryController],
  providers: [SummaryService],
})
export class SummaryModule {}
