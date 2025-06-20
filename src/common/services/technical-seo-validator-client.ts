import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Technical SEO Validator Client
 * 
 * This client provides a unified interface to interact with both the serverless
 * and containerized versions of the Technical SEO Validator.
 */
@Injectable()
export class TechnicalSeoValidatorClient {
  private readonly logger = new Logger(TechnicalSeoValidatorClient.name);
  private readonly serverlessEndpoint: string;
  private readonly containerEndpoint: string;
  private readonly functionKey: string;
  private readonly containerApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.serverlessEndpoint = this.configService.get<string>('TECHNICAL_SEO_VALIDATOR_SERVERLESS_URL', 
      'https://ca-seo-validator.azurewebsites.net/api/validate');
    this.containerEndpoint = this.configService.get<string>('TECHNICAL_SEO_VALIDATOR_CONTAINER_URL',
      'https://ca-seo-validator.region.azurecontainer.io:8080/api/validate');
    this.functionKey = this.configService.get<string>('TECHNICAL_SEO_VALIDATOR_SERVERLESS_KEY', '');
    this.containerApiKey = this.configService.get<string>('TECHNICAL_SEO_VALIDATOR_CONTAINER_KEY', '');
  }

  /**
   * Validate a URL using the containerized validator (with Puppeteer support)
   * Falls back to serverless validator with a warning if container is unavailable
   */
  async validateUrl(url: string, options: ValidationOptions = {}): Promise<ValidationResult> {
    try {
      this.logger.log(`Validating URL: ${url} using containerized validator`);
      
      const response = await axios.post(
        this.containerEndpoint, 
        {
          url,
          ...this.buildValidationOptions(options)
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.containerApiKey
          },
          timeout: 30000 // 30 second timeout for URL validation
        }
      );
      
      return response.data;
    } catch (error) {
      this.logger.warn(`Container validator unavailable, URL validation not supported in serverless mode: ${error.message}`);
      return {
        error: 'URL validation requires the containerized validator which is currently unavailable',
        fallbackAvailable: false,
        containerStatus: 'unavailable'
      };
    }
  }

  /**
   * Validate HTML content using the serverless validator
   * This is the preferred method for HTML validation as it's faster and more cost-effective
   */
  async validateHtml(html: string, options: ValidationOptions = {}): Promise<ValidationResult> {
    try {
      this.logger.log('Validating HTML using serverless validator');
      
      const endpoint = this.serverlessEndpoint + (this.functionKey ? `?code=${this.functionKey}` : '');
      
      const response = await axios.post(
        endpoint,
        {
          html,
          ...this.buildValidationOptions(options)
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 second timeout for HTML validation
        }
      );
      
      return response.data;
    } catch (error) {
      this.logger.error(`Error validating HTML with serverless validator: ${error.message}`);
      
      // Try fallback to container validator if serverless fails
      try {
        this.logger.log('Attempting fallback to container validator for HTML validation');
        
        const response = await axios.post(
          this.containerEndpoint,
          {
            html,
            ...this.buildValidationOptions(options)
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.containerApiKey
            },
            timeout: 15000
          }
        );
        
        return {
          ...response.data,
          note: 'Validation performed using container fallback due to serverless validator unavailability'
        };
      } catch (fallbackError) {
        this.logger.error(`Fallback to container validator also failed: ${fallbackError.message}`);
        throw new Error(`HTML validation failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
      }
    }
  }

  /**
   * Smart validate automatically chooses the best validator based on the input
   * - For URLs: Uses containerized validator
   * - For HTML: Uses serverless validator
   */
  async smartValidate(input: { url?: string; html?: string }, options: ValidationOptions = {}): Promise<ValidationResult> {
    if (!input.url && !input.html) {
      throw new Error('Either URL or HTML content is required');
    }
    
    // If HTML is provided, prefer that over URL for faster validation
    if (input.html) {
      return this.validateHtml(input.html, options);
    } else if (input.url) {
      return this.validateUrl(input.url, options);
    }
  }

  /**
   * Build validation options object from provided options
   */
  private buildValidationOptions(options: ValidationOptions): Record<string, any> {
    return {
      contentType: options.contentType || 'ARTICLE',
      validateSemanticHtml: options.validateSemanticHtml !== false,
      validateAccessibility: options.validateAccessibility !== false,
      validateHeadingStructure: options.validateHeadingStructure !== false,
      validateMetaTags: options.validateMetaTags !== false,
      validateImages: options.validateImages !== false,
      validateLinks: options.validateLinks !== false,
      validateMobileFriendly: options.validateMobileFriendly !== false,
      validatePageSpeed: options.validatePageSpeed !== false,
      validateStructuredData: options.validateStructuredData !== false,
      validateSocialTags: options.validateSocialTags !== false
    };
  }
}

/**
 * Validation options interface
 */
export interface ValidationOptions {
  contentType?: string;
  validateSemanticHtml?: boolean;
  validateAccessibility?: boolean;
  validateHeadingStructure?: boolean;
  validateMetaTags?: boolean;
  validateImages?: boolean;
  validateLinks?: boolean;
  validateMobileFriendly?: boolean;
  validatePageSpeed?: boolean;
  validateStructuredData?: boolean;
  validateSocialTags?: boolean;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  id?: string;
  url?: string;
  contentType?: string;
  validatedAt?: string;
  score?: {
    overall: number;
    accessibility: number;
    semanticStructure: number;
    mobileFriendly: number;
  };
  metrics?: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    [key: string]: number;
  };
  issues?: Array<{
    id: string;
    type: string;
    message: string;
    description: string;
    severity: string;
    element?: string;
    recommendation?: string;
  }>;
  recommendations?: string[];
  error?: string;
  fallbackAvailable?: boolean;
  containerStatus?: string;
  note?: string;
}
