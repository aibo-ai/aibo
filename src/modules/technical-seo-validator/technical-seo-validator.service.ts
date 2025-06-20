import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// Define the health check response interface
interface HealthStatus {
  serverless: {
    available: boolean;
    url?: string;
    error?: string;
  };
  container: {
    available: boolean;
    url?: string;
    error?: string;
  };
  overall: {
    available: boolean;
    preferredValidator: 'serverless' | 'container' | 'none';
  };
}

@Injectable()
export class TechnicalSeoValidatorService {
  private readonly serverlessUrl: string;
  private readonly serverlessKey: string;
  private readonly containerUrl: string;
  private readonly containerKey: string;
  private readonly logger = new Logger(TechnicalSeoValidatorService.name);

  constructor(private configService: ConfigService) {
    this.serverlessUrl = this.configService.get<string>('TECHNICAL_SEO_VALIDATOR_SERVERLESS_URL') || 
      'https://ca-seo-validator.azurewebsites.net/api/validate';
    this.serverlessKey = this.configService.get<string>('TECHNICAL_SEO_VALIDATOR_SERVERLESS_KEY') || '';
    this.containerUrl = this.configService.get<string>('TECHNICAL_SEO_VALIDATOR_CONTAINER_URL') || 
      'http://ca-seo-validator.eastus.azurecontainer.io:8080/api/validate';
    this.containerKey = this.configService.get<string>('TECHNICAL_SEO_VALIDATOR_CONTAINER_KEY') || '';
    
    this.logger.log(`Serverless validator URL: ${this.serverlessUrl}`);
    this.logger.log(`Container validator URL: ${this.containerUrl}`);
  }

  /**
   * Validate a URL using the Technical SEO Validator
   * This requires the containerized validator with Puppeteer
   */
  async validateUrl(url: string): Promise<any> {
    try {
      // URL validation requires Puppeteer, so we use the container validator
      if (!this.containerUrl) {
        throw new Error('Container validator URL not configured');
      }

      this.logger.log(`Validating URL with container validator: ${url}`);
      const response = await axios.post(
        this.containerUrl,
        { url },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.containerKey,
          },
          timeout: 30000, // 30 second timeout for URL validation
        },
      );

      return response.data;
    } catch (error) {
      // Fallback to serverless validator if container is not available
      // Note: This will only validate the HTML, not the full URL experience
      this.logger.warn('Container validator failed, falling back to serverless validator');
      this.logger.error(`Container validator error: ${error.message}`);

      // We can't validate URLs with the serverless validator directly
      // Instead, we'll fetch the HTML and then validate it
      try {
        this.logger.log(`Fetching HTML from URL: ${url}`);
        const htmlResponse = await axios.get(url, { timeout: 10000 });
        return this.validateHtml(htmlResponse.data);
      } catch (fallbackError) {
        throw new Error(`URL validation failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
      }
    }
  }

  /**
   * Validate HTML content using the Technical SEO Validator
   * This can use either the serverless or containerized validator
   */
  async validateHtml(html: string): Promise<any> {
    try {
      // Try serverless validator first (faster, less resource intensive)
      if (this.serverlessUrl) {
        this.logger.log('Validating HTML with serverless validator');
        const response = await axios.post(
          this.serverlessUrl,
          { html },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-functions-key': this.serverlessKey,
            },
            timeout: 10000, // 10 second timeout
          },
        );

        return response.data;
      }
    } catch (error) {
      this.logger.warn('Serverless validator failed, falling back to container validator');
      this.logger.error(`Serverless validator error: ${error.message}`);
    }

    // Fall back to container validator if serverless fails or is not configured
    try {
      if (!this.containerUrl) {
        throw new Error('No validators available');
      }

      this.logger.log('Falling back to container validator for HTML validation');
      const response = await axios.post(
        this.containerUrl,
        { html },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.containerKey,
          },
          timeout: 15000, // 15 second timeout
        },
      );

      return response.data;
    } catch (error) {
      throw new Error(`HTML validation failed: ${error.message}`);
    }
  }

  /**
   * Smart validate - automatically determine if input is a URL or HTML and use the appropriate validator
   */
  async validate(input: string): Promise<any> {
    // Simple check to determine if input is likely a URL
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/;
    const isUrl = urlPattern.test(input);

    this.logger.log(`Smart validating input as ${isUrl ? 'URL' : 'HTML'}`);
    if (isUrl) {
      // Ensure URL has protocol
      const url = input.startsWith('http') ? input : `https://${input}`;
      return this.validateUrl(url);
    } else {
      return this.validateHtml(input);
    }
  }

  /**
   * Check the health of the Technical SEO Validator services
   */
  async checkHealth(): Promise<HealthStatus> {
    this.logger.log('Checking Technical SEO Validator health');
    
    const health: HealthStatus = {
      serverless: {
        available: false,
      },
      container: {
        available: false,
      },
      overall: {
        available: false,
        preferredValidator: 'none',
      },
    };

    // Check serverless validator
    if (this.serverlessUrl) {
      health.serverless.url = this.serverlessUrl;
      try {
        this.logger.log(`Checking serverless validator health: ${this.serverlessUrl}`);
        // Use GET instead of HEAD as some Azure Functions don't support HEAD
        await axios.get(`${this.serverlessUrl}/health`, {
          headers: {
            'x-functions-key': this.serverlessKey,
          },
          timeout: 5000, // 5 second timeout
        });
        health.serverless.available = true;
        this.logger.log('Serverless validator is available');
      } catch (error) {
        health.serverless.error = error.message;
        this.logger.warn(`Serverless validator health check failed: ${error.message}`);
        
        // Try an alternative approach - some functions don't have a /health endpoint
        try {
          await axios.options(this.serverlessUrl, {
            headers: {
              'x-functions-key': this.serverlessKey,
            },
            timeout: 5000,
          });
          health.serverless.available = true;
          health.serverless.error = undefined;
          this.logger.log('Serverless validator is available (via OPTIONS request)');
        } catch (optionsError) {
          this.logger.error(`Serverless validator is unavailable: ${optionsError.message}`);
        }
      }
    } else {
      health.serverless.error = 'URL not configured';
      this.logger.warn('Serverless validator URL not configured');
    }

    // Check container validator
    if (this.containerUrl) {
      health.container.url = this.containerUrl;
      try {
        this.logger.log(`Checking container validator health: ${this.containerUrl}`);
        // Use GET instead of HEAD for consistency
        await axios.get(`${this.containerUrl}/health`, {
          headers: {
            'x-api-key': this.containerKey,
          },
          timeout: 5000, // 5 second timeout
        });
        health.container.available = true;
        this.logger.log('Container validator is available');
      } catch (error) {
        health.container.error = error.message;
        this.logger.warn(`Container validator health check failed: ${error.message}`);
        
        // Try an alternative approach
        try {
          await axios.options(this.containerUrl, {
            headers: {
              'x-api-key': this.containerKey,
            },
            timeout: 5000,
          });
          health.container.available = true;
          health.container.error = undefined;
          this.logger.log('Container validator is available (via OPTIONS request)');
        } catch (optionsError) {
          this.logger.error(`Container validator is unavailable: ${optionsError.message}`);
        }
      }
    } else {
      health.container.error = 'URL not configured';
      this.logger.warn('Container validator URL not configured');
    }

    // Determine overall health and preferred validator
    health.overall.available = health.serverless.available || health.container.available;
    
    if (health.container.available && health.serverless.available) {
      health.overall.preferredValidator = 'container'; // Container is preferred when both are available
      this.logger.log('Both validators available, preferring container validator');
    } else if (health.container.available) {
      health.overall.preferredValidator = 'container';
      this.logger.log('Only container validator is available');
    } else if (health.serverless.available) {
      health.overall.preferredValidator = 'serverless';
      this.logger.log('Only serverless validator is available');
    } else {
      health.overall.preferredValidator = 'none';
      this.logger.warn('No validators are available');
    }

    return health;
  }
}
