import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AudioGenerationController } from './controllers/audio-generation.controller';
import { ElevenLabsTTSService } from '../../shared/services/elevenlabs-tts.service';

@Module({
  imports: [ConfigModule],
  controllers: [AudioGenerationController],
  providers: [ElevenLabsTTSService],
  exports: [ElevenLabsTTSService]
})
export class AudioGenerationModule {}
