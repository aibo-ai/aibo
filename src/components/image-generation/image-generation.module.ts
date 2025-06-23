import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImageGenerationController } from './controllers/image-generation.controller';
import { DalleImageService } from '../../shared/services/dalle-image.service';

@Module({
  imports: [ConfigModule],
  controllers: [ImageGenerationController],
  providers: [DalleImageService],
  exports: [DalleImageService]
})
export class ImageGenerationModule {}
