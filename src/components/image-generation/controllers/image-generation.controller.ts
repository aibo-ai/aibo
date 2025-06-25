import { Controller, Post, Body, Get, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { DalleImageService, ContentImageRequest, GeneratedImage } from '../../../shared/services/dalle-image.service';

@ApiTags('Image Generation')
@Controller('image-generation')
export class ImageGenerationController {
  private readonly logger = new Logger(ImageGenerationController.name);

  constructor(private readonly dalleImageService: DalleImageService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get image generation service status' })
  @ApiResponse({ status: 200, description: 'Service status retrieved successfully' })
  getStatus() {
    return {
      success: true,
      data: this.dalleImageService.getStatus(),
      timestamp: new Date().toISOString()
    };
  }

  @Post('generate-content-image')
  @ApiOperation({ summary: 'Generate image for content using DALL-E' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Content topic' },
        contentType: { type: 'string', description: 'Type of content (blog_post, whitepaper, etc.)' },
        audience: { type: 'string', description: 'Target audience (b2b, b2c, etc.)' },
        keyPoints: { type: 'array', items: { type: 'string' }, description: 'Key points to visualize' },
        style: { 
          type: 'string', 
          enum: ['infographic', 'illustration', 'diagram', 'chart', 'conceptual'],
          description: 'Image style' 
        },
        colorScheme: { 
          type: 'string', 
          enum: ['professional', 'vibrant', 'minimal', 'corporate'],
          description: 'Color scheme' 
        }
      },
      required: ['topic', 'contentType', 'audience']
    }
  })
  @ApiResponse({ status: 201, description: 'Image generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 503, description: 'Image generation service unavailable' })
  async generateContentImage(@Body() request: ContentImageRequest) {
    try {
      this.logger.log(`Generating content image for topic: ${request.topic}`);

      if (!this.dalleImageService.isAvailable()) {
        throw new HttpException(
          'Image generation service is not available. Please check OpenAI API configuration.',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      // Validate required fields
      if (!request.topic || !request.contentType || !request.audience) {
        throw new HttpException(
          'Missing required fields: topic, contentType, and audience are required',
          HttpStatus.BAD_REQUEST
        );
      }

      const generatedImage = await this.dalleImageService.generateContentImage(request);

      return {
        success: true,
        data: generatedImage,
        message: 'Image generated successfully',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to generate content image: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Image generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('generate-infographic')
  @ApiOperation({ summary: 'Generate infographic for content' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Content topic' },
        audience: { type: 'string', description: 'Target audience' },
        keyPoints: { type: 'array', items: { type: 'string' }, description: 'Key data points' },
        colorScheme: { type: 'string', description: 'Color scheme preference' }
      },
      required: ['topic', 'audience', 'keyPoints']
    }
  })
  @ApiResponse({ status: 201, description: 'Infographic generated successfully' })
  async generateInfographic(@Body() body: { topic: string; audience: string; keyPoints: string[]; colorScheme?: string }) {
    try {
      const request: ContentImageRequest = {
        topic: body.topic,
        contentType: 'infographic',
        audience: body.audience,
        keyPoints: body.keyPoints,
        style: 'infographic',
        colorScheme: (body.colorScheme as 'professional' | 'vibrant' | 'minimal' | 'corporate') || 'professional'
      };

      const generatedImage = await this.dalleImageService.generateContentImage(request);

      return {
        success: true,
        data: generatedImage,
        message: 'Infographic generated successfully',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to generate infographic: ${error.message}`);
      throw new HttpException(
        `Infographic generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('generate-diagram')
  @ApiOperation({ summary: 'Generate technical diagram' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Diagram topic' },
        audience: { type: 'string', description: 'Target audience' },
        components: { type: 'array', items: { type: 'string' }, description: 'Diagram components' },
        diagramType: { type: 'string', description: 'Type of diagram (flowchart, architecture, etc.)' }
      },
      required: ['topic', 'audience', 'components']
    }
  })
  @ApiResponse({ status: 201, description: 'Diagram generated successfully' })
  async generateDiagram(@Body() body: { topic: string; audience: string; components: string[]; diagramType?: string }) {
    try {
      const request: ContentImageRequest = {
        topic: `${body.diagramType || 'technical'} diagram for ${body.topic}`,
        contentType: 'diagram',
        audience: body.audience,
        keyPoints: body.components,
        style: 'diagram',
        colorScheme: 'professional'
      };

      const generatedImage = await this.dalleImageService.generateContentImage(request);

      return {
        success: true,
        data: generatedImage,
        message: 'Diagram generated successfully',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to generate diagram: ${error.message}`);
      throw new HttpException(
        `Diagram generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
