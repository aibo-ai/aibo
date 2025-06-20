import { Controller, Post, Get, Body, Query, Logger, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { TechnicalSeoValidatorService } from './technical-seo-validator.service';
import { IsOptional, IsString, IsBoolean, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

enum ContentType {
  ARTICLE = 'ARTICLE',
  BLOG_POST = 'BLOG_POST',
  LANDING_PAGE = 'LANDING_PAGE',
  PRODUCT_PAGE = 'PRODUCT_PAGE',
  CATEGORY_PAGE = 'CATEGORY_PAGE',
  HOME_PAGE = 'HOME_PAGE',
  ABOUT_PAGE = 'ABOUT_PAGE',
  CONTACT_PAGE = 'CONTACT_PAGE',
  OTHER = 'OTHER'
}

class ValidationOptionsDto {
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsOptional()
  @IsBoolean()
  validateSemanticHtml?: boolean;

  @IsOptional()
  @IsBoolean()
  validateAccessibility?: boolean;

  @IsOptional()
  @IsBoolean()
  validateHeadingStructure?: boolean;

  @IsOptional()
  @IsBoolean()
  validateMetaTags?: boolean;

  @IsOptional()
  @IsBoolean()
  validateImages?: boolean;

  @IsOptional()
  @IsBoolean()
  validateLinks?: boolean;

  @IsOptional()
  @IsBoolean()
  validateMobileFriendly?: boolean;

  @IsOptional()
  @IsBoolean()
  validatePageSpeed?: boolean;

  @IsOptional()
  @IsBoolean()
  validateStructuredData?: boolean;

  @IsOptional()
  @IsBoolean()
  validateSocialTags?: boolean;
}

class ValidateUrlDto {
  @IsString()
  url: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ValidationOptionsDto)
  options?: ValidationOptionsDto;
}

class ValidateHtmlDto {
  @IsString()
  html: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ValidationOptionsDto)
  options?: ValidationOptionsDto;
}

class ValidateContentDto {
  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ValidationOptionsDto)
  options?: ValidationOptionsDto;
}

@ApiTags('technical-seo-validator')
@Controller('technical-seo-validator')
export class TechnicalSeoValidatorController {
  private readonly logger = new Logger(TechnicalSeoValidatorController.name);

  constructor(private readonly seoValidatorService: TechnicalSeoValidatorService) {}

  @Post('validate-url')
  @ApiOperation({ summary: 'Validate a URL for SEO best practices' })
  @ApiBody({ type: ValidateUrlDto })
  @ApiResponse({ status: 200, description: 'URL validation results' })
  async validateUrl(@Body(ValidationPipe) body: ValidateUrlDto) {
    this.logger.log(`Received request to validate URL: ${body.url}`);
    return this.seoValidatorService.validateUrl(body.url);
  }

  @Post('validate-html')
  @ApiOperation({ summary: 'Validate HTML content for SEO best practices' })
  @ApiBody({ type: ValidateHtmlDto })
  @ApiResponse({ status: 200, description: 'HTML validation results' })
  async validateHtml(@Body(ValidationPipe) body: ValidateHtmlDto) {
    this.logger.log('Received request to validate HTML content');
    return this.seoValidatorService.validateHtml(body.html);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Smart validate content (URL or HTML) for SEO best practices' })
  @ApiBody({ type: ValidateContentDto })
  @ApiResponse({ status: 200, description: 'Validation results' })
  async validate(@Body(ValidationPipe) body: ValidateContentDto) {
    this.logger.log(`Received smart validation request: ${body.url || 'HTML content'}`);
    // Determine whether to use URL or HTML validation
    if (body.url) {
      return this.seoValidatorService.validateUrl(body.url);
    } else if (body.html) {
      return this.seoValidatorService.validateHtml(body.html);
    } else {
      throw new Error('Either URL or HTML must be provided');
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Check the health of the SEO validators' })
  @ApiResponse({ status: 200, description: 'Health status of both validators' })
  async health() {
    this.logger.log('Checking validator health');
    return this.seoValidatorService.checkHealth();
  }
}
