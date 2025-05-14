import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { YoutubeModule } from './modules/youtube/youtube.module';
import { SummaryModule } from './modules/summary/summary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    YoutubeModule,
    SummaryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
