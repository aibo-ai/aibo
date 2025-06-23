import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
import { 
  DomainAuthorityResult, 
  UrlValidationResult, 
  CitationVerificationConfig 
} from './interfaces/citation-verification.interfaces';

@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);
  private readonly config: CitationVerificationConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly appInsights: ApplicationInsightsService
  ) {
    this.config = {
      crossrefApiUrl: this.configService.get('CROSSREF_API_URL', 'https://api.crossref.org'),
      crossrefApiKey: this.configService.get('CROSSREF_API_KEY'),
      
      mozApiUrl: this.configService.get('MOZ_API_URL', 'https://lsapi.seomoz.com'),
      mozApiKey: this.configService.get('MOZ_API_KEY'),
      mozApiSecret: this.configService.get('MOZ_API_SECRET'),
      
      ahrefsApiUrl: this.configService.get('AHREFS_API_URL', 'https://apiv2.ahrefs.com'),
      ahrefsApiKey: this.configService.get('AHREFS_API_KEY'),
      
      urlValidationApiUrl: this.configService.get('URL_VALIDATION_API_URL'),
      urlValidationApiKey: this.configService.get('URL_VALIDATION_API_KEY'),
      
      maxRequestsPerMinute: parseInt(this.configService.get('CITATION_API_MAX_REQUESTS_PER_MINUTE', '60')),
      maxConcurrentRequests: parseInt(this.configService.get('CITATION_API_MAX_CONCURRENT_REQUESTS', '5')),
      
      cacheEnabled: this.configService.get('CITATION_CACHE_ENABLED', 'true') === 'true',
      cacheTtlMinutes: parseInt(this.configService.get('CITATION_CACHE_TTL_MINUTES', '1440')), // 24 hours
      
      apiTimeoutMs: parseInt(this.configService.get('CITATION_API_TIMEOUT_MS', '10000')),
      retryAttempts: parseInt(this.configService.get('CITATION_API_RETRY_ATTEMPTS', '3')),
      retryDelayMs: parseInt(this.configService.get('CITATION_API_RETRY_DELAY_MS', '1000'))
    };
  }

  /**
   * Validate URL accessibility and extract metadata
   */
  async validateUrl(url: string): Promise<UrlValidationResult> {
    const startTime = Date.now();
    const requestId = `url-val-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    this.logger.log(`Validating URL: ${url} [${requestId}]`);
    this.appInsights.trackEvent('ExternalApi:UrlValidation:Start', {
      requestId,
      url: url
    });

    try {
      // Basic URL format validation
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch (error) {
        return {
          url,
          isValid: false,
          isAccessible: false,
          isSecure: false,
          errors: ['Invalid URL format'],
          metadata: {
            checkedAt: new Date().toISOString(),
            responseTime: Date.now() - startTime
          }
        };
      }

      // Check if URL is secure
      const isSecure = parsedUrl.protocol === 'https:';

      // Attempt to fetch the URL
      try {
        const response = await firstValueFrom(
          this.httpService.head(url, {
            timeout: this.config.apiTimeoutMs,
            maxRedirects: 5,
            validateStatus: (status) => status < 500 // Accept redirects and client errors
          })
        );

        const result: UrlValidationResult = {
          url,
          isValid: true,
          isAccessible: response.status < 400,
          statusCode: response.status,
          contentType: response.headers['content-type'],
          lastModified: response.headers['last-modified'],
          isSecure,
          redirectChain: this.extractRedirectChain(response),
          errors: response.status >= 400 ? [`HTTP ${response.status}`] : [],
          metadata: {
            checkedAt: new Date().toISOString(),
            responseTime: Date.now() - startTime
          }
        };

        // If HEAD request was successful and it's HTML, try to get title
        if (response.status < 300 && response.headers['content-type']?.includes('text/html')) {
          try {
            const getResponse = await firstValueFrom(
              this.httpService.get(url, {
                timeout: this.config.apiTimeoutMs,
                maxRedirects: 5,
                responseType: 'text'
              })
            );
            
            const titleMatch = getResponse.data.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch) {
              result.title = titleMatch[1].trim();
            }
          } catch (error) {
            // Title extraction failed, but URL is still valid
            this.logger.warn(`Failed to extract title from ${url}: ${error.message}`);
          }
        }

        this.appInsights.trackEvent('ExternalApi:UrlValidation:Success', {
          requestId,
          url,
          statusCode: response.status,
          responseTime: result.metadata.responseTime
        });

        return result;

      } catch (error) {
        const result: UrlValidationResult = {
          url,
          isValid: true, // URL format is valid
          isAccessible: false,
          isSecure,
          errors: [error.message || 'Network error'],
          metadata: {
            checkedAt: new Date().toISOString(),
            responseTime: Date.now() - startTime
          }
        };

        this.appInsights.trackEvent('ExternalApi:UrlValidation:NetworkError', {
          requestId,
          url,
          error: error.message,
          responseTime: result.metadata.responseTime
        });

        return result;
      }

    } catch (error) {
      this.logger.error(`URL validation failed for ${url}: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        requestId,
        url,
        operation: 'UrlValidation'
      });

      return {
        url,
        isValid: false,
        isAccessible: false,
        isSecure: false,
        errors: ['Validation failed'],
        metadata: {
          checkedAt: new Date().toISOString(),
          responseTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Get domain authority from Moz API
   */
  async getMozDomainAuthority(domain: string): Promise<DomainAuthorityResult | null> {
    if (!this.config.mozApiKey || !this.config.mozApiSecret) {
      this.logger.warn('Moz API credentials not configured');
      return null;
    }

    const requestId = `moz-da-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    try {
      this.logger.log(`Getting Moz domain authority for: ${domain} [${requestId}]`);
      
      // Moz API requires authentication
      const auth = Buffer.from(`${this.config.mozApiKey}:${this.config.mozApiSecret}`).toString('base64');
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.config.mozApiUrl}/linkscape/url-metrics/${encodeURIComponent(domain)}`,
          {
            targets: [domain]
          },
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            timeout: this.config.apiTimeoutMs
          }
        )
      );

      const data = response.data;
      
      return {
        domain,
        authorityScore: data.domain_authority || 0,
        trustScore: data.page_authority || 0,
        spamScore: data.spam_score || 0,
        backlinks: data.external_equity_links || 0,
        referringDomains: data.linking_root_domains || 0,
        isGovernment: domain.endsWith('.gov'),
        isEducational: domain.endsWith('.edu'),
        isNonProfit: domain.endsWith('.org'),
        isNews: this.isNewsWebsite(domain),
        metadata: {
          source: 'moz',
          checkedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      this.logger.error(`Moz API request failed for ${domain}: ${error.message}`);
      this.appInsights.trackException(error, {
        requestId,
        domain,
        operation: 'MozDomainAuthority'
      });
      return null;
    }
  }

  /**
   * Get domain authority from Ahrefs API
   */
  async getAhrefsDomainAuthority(domain: string): Promise<DomainAuthorityResult | null> {
    if (!this.config.ahrefsApiKey) {
      this.logger.warn('Ahrefs API key not configured');
      return null;
    }

    const requestId = `ahrefs-da-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    try {
      this.logger.log(`Getting Ahrefs domain authority for: ${domain} [${requestId}]`);
      
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.config.ahrefsApiUrl}/domain-rating`,
          {
            params: {
              target: domain,
              token: this.config.ahrefsApiKey
            },
            timeout: this.config.apiTimeoutMs
          }
        )
      );

      const data = response.data;
      
      return {
        domain,
        authorityScore: data.domain_rating || 0,
        trustScore: data.domain_rating || 0, // Ahrefs doesn't have separate trust score
        backlinks: data.backlinks || 0,
        referringDomains: data.referring_domains || 0,
        isGovernment: domain.endsWith('.gov'),
        isEducational: domain.endsWith('.edu'),
        isNonProfit: domain.endsWith('.org'),
        isNews: this.isNewsWebsite(domain),
        metadata: {
          source: 'ahrefs',
          checkedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      this.logger.error(`Ahrefs API request failed for ${domain}: ${error.message}`);
      this.appInsights.trackException(error, {
        requestId,
        domain,
        operation: 'AhrefsDomainAuthority'
      });
      return null;
    }
  }

  /**
   * Verify DOI using Crossref API
   */
  async verifyDoi(doi: string): Promise<any> {
    const requestId = `crossref-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    try {
      this.logger.log(`Verifying DOI: ${doi} [${requestId}]`);
      
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.config.crossrefApiUrl}/works/${encodeURIComponent(doi)}`,
          {
            headers: {
              'User-Agent': 'ContentArchitect/1.0 (mailto:support@contentarchitect.com)'
            },
            timeout: this.config.apiTimeoutMs
          }
        )
      );

      return {
        valid: true,
        metadata: response.data.message,
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      this.logger.warn(`DOI verification failed for ${doi}: ${error.message}`);
      return {
        valid: false,
        error: error.message,
        checkedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Extract redirect chain from response
   */
  private extractRedirectChain(response: any): string[] {
    // This would need to be implemented based on the HTTP client's redirect handling
    // For now, return empty array
    return [];
  }

  /**
   * Check if domain is a known news website
   */
  private isNewsWebsite(domain: string): boolean {
    const newsPatterns = [
      'news', 'times', 'post', 'herald', 'tribune', 'journal', 'gazette',
      'reuters', 'ap.org', 'bbc.', 'cnn.', 'npr.', 'pbs.', 'abc.', 'nbc.',
      'cbs.', 'fox', 'guardian', 'economist', 'wsj.', 'nytimes', 'washingtonpost'
    ];
    
    return newsPatterns.some(pattern => domain.toLowerCase().includes(pattern));
  }
}
