import { Controller, Post, Body, Logger, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ContentType } from '../../../common/interfaces/content.interfaces';
import { SeoValidationParams, SeoValidationResult } from '../../../common/interfaces/seo-validator.interfaces';
import { TechnicalSeoValidatorService } from '../services/technical-seo-validator.service';

class ValidateSeoDto implements SeoValidationParams {
  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  html?: string;

  @IsString()
  @IsOptional()
  @IsOptional()
  contentType?: ContentType;

  @IsBoolean()
  @IsOptional()
  validateMobileFriendliness?: boolean;

  @IsBoolean()
  @IsOptional()
  validateAccessibility?: boolean;

  @IsBoolean()
  @IsOptional()
  validateHeadingStructure?: boolean;

  @IsBoolean()
  @IsOptional()
  validateSemanticHtml?: boolean;

  @IsBoolean()
  @IsOptional()
  validateCrawlerAccessibility?: boolean;

  @IsBoolean()
  @IsOptional()
  validateStructuredData?: boolean;

  @IsBoolean()
  @IsOptional()
  validateMetaTags?: boolean;

  @IsBoolean()
  @IsOptional()
  validatePerformance?: boolean;

  @IsBoolean()
  @IsOptional()
  validateContentQuality?: boolean;
}

@ApiTags('Technical SEO')
@Controller('api/seo-validator')
export class TechnicalSeoValidatorController {
  private readonly logger = new Logger(TechnicalSeoValidatorController.name);

  constructor(private readonly seoValidator: TechnicalSeoValidatorService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate content for technical SEO requirements' })
  @ApiResponse({
    status: 200,
    description: 'The content has been validated successfully',
    type: Object
  })
  @ApiResponse({ status: 400, description: 'Invalid input parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async validateContent(
    @Body(new ValidationPipe({ transform: true })) validateSeoDto: ValidateSeoDto
  ): Promise<{ data: SeoValidationResult; error?: string }> {
    try {
      this.logger.log(`Validating content: ${validateSeoDto.url || 'HTML content'}`);
      
      if (!validateSeoDto.url && !validateSeoDto.html) {
        return {
          data: null,
          error: 'Either URL or HTML content must be provided'
        };
      }
      
      const result = await this.seoValidator.validateContent(validateSeoDto);
      
      return {
        data: result,
        error: null
      };
    } catch (error) {
      this.logger.error(`Error validating content: ${error.message}`, error.stack);
      
      return {
        data: null,
        error: `Failed to validate content: ${error.message}`
      };
    }
  }
}
