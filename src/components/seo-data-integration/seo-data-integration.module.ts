import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleTrendsService } from './services/google-trends.service';
import { AmazonKeywordsService } from './services/amazon-keywords.service';
import { SeoDataController } from './controllers/seo-data.controller';

@Module({
  imports: [ConfigModule],
  controllers: [SeoDataController],
  providers: [GoogleTrendsService, AmazonKeywordsService],
  exports: [GoogleTrendsService, AmazonKeywordsService]
})
export class SeoDataIntegrationModule {}
