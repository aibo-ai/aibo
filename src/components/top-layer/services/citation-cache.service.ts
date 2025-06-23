import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
import { 
  CitationCacheEntry, 
  CitationVerificationResult, 
  DomainAuthorityResult, 
  UrlValidationResult 
} from './interfaces/citation-verification.interfaces';

@Injectable()
export class CitationCacheService {
  private readonly logger = new Logger(CitationCacheService.name);
  private readonly cache = new Map<string, CitationCacheEntry>();
  private readonly cacheEnabled: boolean;
  private readonly cacheTtlMinutes: number;
  private readonly maxCacheSize: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {
    this.cacheEnabled = this.configService.get('CITATION_CACHE_ENABLED', 'true') === 'true';
    this.cacheTtlMinutes = parseInt(this.configService.get('CITATION_CACHE_TTL_MINUTES', '1440')); // 24 hours
    this.maxCacheSize = parseInt(this.configService.get('CITATION_CACHE_MAX_SIZE', '10000'));

    // Clean up expired entries every hour
    if (this.cacheEnabled) {
      setInterval(() => this.cleanupExpiredEntries(), 60 * 60 * 1000);
    }
  }

  /**
   * Get cached result for citation verification
   */
  async getCitationVerification(key: string): Promise<CitationVerificationResult | null> {
    if (!this.cacheEnabled) return null;

    const entry = this.cache.get(this.generateKey('citation', key));
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.cache.delete(this.generateKey('citation', key));
      return null;
    }

    entry.hitCount++;
    this.appInsights.trackEvent('CitationCache:Hit', {
      type: 'citation',
      key: key,
      hitCount: entry.hitCount
    });

    return entry.result as CitationVerificationResult;
  }

  /**
   * Cache citation verification result
   */
  async setCitationVerification(key: string, result: CitationVerificationResult): Promise<void> {
    if (!this.cacheEnabled) return;

    const cacheKey = this.generateKey('citation', key);
    const expiresAt = new Date(Date.now() + this.cacheTtlMinutes * 60 * 1000).toISOString();

    const entry: CitationCacheEntry = {
      key: cacheKey,
      result,
      createdAt: new Date().toISOString(),
      expiresAt,
      hitCount: 0
    };

    this.cache.set(cacheKey, entry);
    this.enforceMaxSize();

    this.appInsights.trackEvent('CitationCache:Set', {
      type: 'citation',
      key: key,
      cacheSize: this.cache.size
    });
  }

  /**
   * Get cached domain authority result
   */
  async getDomainAuthority(domain: string): Promise<DomainAuthorityResult | null> {
    if (!this.cacheEnabled) return null;

    const entry = this.cache.get(this.generateKey('domain', domain));
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.cache.delete(this.generateKey('domain', domain));
      return null;
    }

    entry.hitCount++;
    this.appInsights.trackEvent('CitationCache:Hit', {
      type: 'domain',
      key: domain,
      hitCount: entry.hitCount
    });

    return entry.result as DomainAuthorityResult;
  }

  /**
   * Cache domain authority result
   */
  async setDomainAuthority(domain: string, result: DomainAuthorityResult): Promise<void> {
    if (!this.cacheEnabled) return;

    const cacheKey = this.generateKey('domain', domain);
    const expiresAt = new Date(Date.now() + this.cacheTtlMinutes * 60 * 1000).toISOString();

    const entry: CitationCacheEntry = {
      key: cacheKey,
      result,
      createdAt: new Date().toISOString(),
      expiresAt,
      hitCount: 0
    };

    this.cache.set(cacheKey, entry);
    this.enforceMaxSize();

    this.appInsights.trackEvent('CitationCache:Set', {
      type: 'domain',
      key: domain,
      cacheSize: this.cache.size
    });
  }

  /**
   * Get cached URL validation result
   */
  async getUrlValidation(url: string): Promise<UrlValidationResult | null> {
    if (!this.cacheEnabled) return null;

    const entry = this.cache.get(this.generateKey('url', url));
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.cache.delete(this.generateKey('url', url));
      return null;
    }

    entry.hitCount++;
    this.appInsights.trackEvent('CitationCache:Hit', {
      type: 'url',
      key: url,
      hitCount: entry.hitCount
    });

    return entry.result as UrlValidationResult;
  }

  /**
   * Cache URL validation result
   */
  async setUrlValidation(url: string, result: UrlValidationResult): Promise<void> {
    if (!this.cacheEnabled) return;

    const cacheKey = this.generateKey('url', url);
    // URL validation results expire faster (1 hour) as they can change more frequently
    const urlCacheTtl = Math.min(this.cacheTtlMinutes, 60);
    const expiresAt = new Date(Date.now() + urlCacheTtl * 60 * 1000).toISOString();

    const entry: CitationCacheEntry = {
      key: cacheKey,
      result,
      createdAt: new Date().toISOString(),
      expiresAt,
      hitCount: 0
    };

    this.cache.set(cacheKey, entry);
    this.enforceMaxSize();

    this.appInsights.trackEvent('CitationCache:Set', {
      type: 'url',
      key: url,
      cacheSize: this.cache.size
    });
  }

  /**
   * Clear all cache entries
   */
  async clearCache(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    
    this.logger.log(`Cache cleared: ${size} entries removed`);
    this.appInsights.trackEvent('CitationCache:Clear', {
      entriesRemoved: size
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    const entries = Array.from(this.cache.values());
    const now = new Date();
    
    const stats = {
      enabled: this.cacheEnabled,
      totalEntries: entries.length,
      maxSize: this.maxCacheSize,
      ttlMinutes: this.cacheTtlMinutes,
      expiredEntries: entries.filter(entry => this.isExpired(entry)).length,
      hitCounts: {
        total: entries.reduce((sum, entry) => sum + entry.hitCount, 0),
        average: entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.hitCount, 0) / entries.length : 0
      },
      byType: {
        citation: entries.filter(entry => entry.key.startsWith('citation:')).length,
        domain: entries.filter(entry => entry.key.startsWith('domain:')).length,
        url: entries.filter(entry => entry.key.startsWith('url:')).length
      }
    };

    return stats;
  }

  /**
   * Generate cache key with type prefix
   */
  private generateKey(type: string, key: string): string {
    return `${type}:${key}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CitationCacheEntry): boolean {
    return new Date(entry.expiresAt) < new Date();
  }

  /**
   * Remove expired entries from cache
   */
  private cleanupExpiredEntries(): void {
    const initialSize = this.cache.size;
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.log(`Cache cleanup: removed ${removedCount} expired entries`);
      this.appInsights.trackEvent('CitationCache:Cleanup', {
        initialSize,
        removedCount,
        finalSize: this.cache.size
      });
    }
  }

  /**
   * Enforce maximum cache size by removing oldest entries
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.maxCacheSize) return;

    const entries = Array.from(this.cache.entries());
    
    // Sort by creation date (oldest first)
    entries.sort((a, b) => 
      new Date(a[1].createdAt).getTime() - new Date(b[1].createdAt).getTime()
    );

    const toRemove = this.cache.size - this.maxCacheSize;
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    this.logger.log(`Cache size enforced: removed ${toRemove} oldest entries`);
    this.appInsights.trackEvent('CitationCache:SizeEnforcement', {
      removedCount: toRemove,
      finalSize: this.cache.size
    });
  }
}
