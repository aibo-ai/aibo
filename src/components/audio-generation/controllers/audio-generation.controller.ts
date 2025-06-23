import { Controller, Post, Body, Get, Param, Res, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ElevenLabsTTSService, ContentAudioRequest, GeneratedAudio } from '../../../shared/services/elevenlabs-tts.service';

@ApiTags('Audio Generation')
@Controller('audio-generation')
export class AudioGenerationController {
  private readonly logger = new Logger(AudioGenerationController.name);

  constructor(private readonly elevenLabsService: ElevenLabsTTSService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get audio generation service status' })
  @ApiResponse({ status: 200, description: 'Service status retrieved successfully' })
  getStatus() {
    return {
      success: true,
      data: this.elevenLabsService.getStatus(),
      timestamp: new Date().toISOString()
    };
  }

  @Get('voices')
  @ApiOperation({ summary: 'Get available voices from Eleven Labs' })
  @ApiResponse({ status: 200, description: 'Available voices retrieved successfully' })
  async getAvailableVoices() {
    try {
      if (!this.elevenLabsService.isAvailable()) {
        throw new HttpException(
          'Audio generation service is not available. Please check Eleven Labs API configuration.',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      const voices = await this.elevenLabsService.getAvailableVoices();

      return {
        success: true,
        data: voices,
        message: 'Available voices retrieved successfully',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to get available voices: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to retrieve voices: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('generate-content-audio')
  @ApiOperation({ summary: 'Generate audio for content using Eleven Labs' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Text content to convert to speech' },
        contentType: { type: 'string', description: 'Type of content (blog_post, whitepaper, etc.)' },
        audience: { type: 'string', description: 'Target audience (b2b, b2c, etc.)' },
        voiceProfile: { 
          type: 'string', 
          enum: ['professional', 'conversational', 'authoritative', 'friendly', 'narrative'],
          description: 'Voice profile to use' 
        },
        speed: { 
          type: 'string', 
          enum: ['slow', 'normal', 'fast'],
          description: 'Speech speed' 
        },
        outputFormat: { 
          type: 'string', 
          enum: ['mp3_22050_32', 'mp3_44100_32', 'mp3_44100_64', 'mp3_44100_128'],
          description: 'Audio output format' 
        }
      },
      required: ['content', 'contentType', 'audience']
    }
  })
  @ApiResponse({ status: 201, description: 'Audio generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 503, description: 'Audio generation service unavailable' })
  async generateContentAudio(@Body() request: ContentAudioRequest) {
    try {
      this.logger.log(`Generating audio for ${request.contentType} content`);

      if (!this.elevenLabsService.isAvailable()) {
        throw new HttpException(
          'Audio generation service is not available. Please check Eleven Labs API configuration.',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      // Validate required fields
      if (!request.content || !request.contentType || !request.audience) {
        throw new HttpException(
          'Missing required fields: content, contentType, and audience are required',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate content length
      if (request.content.length > 10000) {
        throw new HttpException(
          'Content too long. Maximum 10,000 characters allowed.',
          HttpStatus.BAD_REQUEST
        );
      }

      const generatedAudio = await this.elevenLabsService.generateContentAudio(request);

      return {
        success: true,
        data: generatedAudio,
        message: 'Audio generated successfully',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to generate content audio: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Audio generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('generate-summary-audio')
  @ApiOperation({ summary: 'Generate audio for content summary' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Content title' },
        summary: { type: 'string', description: 'Content summary' },
        audience: { type: 'string', description: 'Target audience' },
        voiceProfile: { type: 'string', description: 'Voice profile preference' }
      },
      required: ['title', 'summary', 'audience']
    }
  })
  @ApiResponse({ status: 201, description: 'Summary audio generated successfully' })
  async generateSummaryAudio(@Body() body: { title: string; summary: string; audience: string; voiceProfile?: string }) {
    try {
      const content = `${body.title}. ${body.summary}`;
      
      const request: ContentAudioRequest = {
        content,
        contentType: 'summary',
        audience: body.audience,
        voiceProfile: body.voiceProfile as any || 'professional',
        speed: 'normal',
        outputFormat: 'mp3_44100_128'
      };

      const generatedAudio = await this.elevenLabsService.generateContentAudio(request);

      return {
        success: true,
        data: generatedAudio,
        message: 'Summary audio generated successfully',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to generate summary audio: ${error.message}`);
      throw new HttpException(
        `Summary audio generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('generate-podcast-style')
  @ApiOperation({ summary: 'Generate podcast-style audio' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Content to convert to podcast format' },
        host: { type: 'string', description: 'Host name for introduction' },
        topic: { type: 'string', description: 'Podcast topic' },
        audience: { type: 'string', description: 'Target audience' }
      },
      required: ['content', 'topic', 'audience']
    }
  })
  @ApiResponse({ status: 201, description: 'Podcast audio generated successfully' })
  async generatePodcastAudio(@Body() body: { content: string; host?: string; topic: string; audience: string }) {
    try {
      // Format content as podcast-style
      const hostName = body.host || 'Your Host';
      const podcastContent = `Welcome to today's episode. I'm ${hostName}, and today we're discussing ${body.topic}. ${body.content} Thank you for listening, and we'll see you next time.`;
      
      const request: ContentAudioRequest = {
        content: podcastContent,
        contentType: 'podcast',
        audience: body.audience,
        voiceProfile: 'conversational',
        speed: 'normal',
        outputFormat: 'mp3_44100_128'
      };

      const generatedAudio = await this.elevenLabsService.generateContentAudio(request);

      return {
        success: true,
        data: generatedAudio,
        message: 'Podcast audio generated successfully',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to generate podcast audio: ${error.message}`);
      throw new HttpException(
        `Podcast audio generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'Download generated audio file' })
  @ApiParam({ name: 'filename', description: 'Audio file name' })
  @ApiResponse({ status: 200, description: 'Audio file downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Audio file not found' })
  async downloadAudio(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const audioDir = path.join(process.cwd(), 'generated-audio');
      const filePath = path.join(audioDir, filename);

      // Validate filename to prevent directory traversal
      if (!filename.match(/^[a-zA-Z0-9_-]+\.mp3$/)) {
        throw new HttpException('Invalid filename', HttpStatus.BAD_REQUEST);
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException('Audio file not found', HttpStatus.NOT_FOUND);
      }

      // Set appropriate headers
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      this.logger.error(`Failed to download audio file: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to download audio file',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
