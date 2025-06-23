import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AzureAIService } from './azure-ai-service';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
import { CitationExtractionService } from './citation-extraction.service';
import { ExternalApiService } from './external-api.service';
import { CitationCacheService } from './citation-cache.service';
import {
  ExtractedCitation,
  CitationVerificationResult,
  DomainAuthorityResult,
  UrlValidationResult,
  CitationAnalysisMetrics
} from './interfaces/citation-verification.interfaces';

@Injectable()
export class CitationAuthorityVerifierService {
  private readonly logger = new Logger(CitationAuthorityVerifierService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly azureAIService: AzureAIService,
    private readonly appInsights: ApplicationInsightsService,
    private readonly citationExtractionService: CitationExtractionService,
    private readonly externalApiService: ExternalApiService,
    private readonly citationCacheService: CitationCacheService
  ) {}
  
  /**
   * Verifies the authority and credibility of citations in content
   * @param content Content with citations to verify
   * @param segment B2B or B2C segment
   */
  async verifyCitations(content: any, segment: 'b2b' | 'b2c'): Promise<any> {
    const startTime = Date.now();
    const verificationId = `verify-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    this.logger.log(`Starting citation verification for ${segment} content [${verificationId}]`);
    this.appInsights.trackEvent('CitationVerification:Start', {
      verificationId,
      segment,
      contentLength: JSON.stringify(content).length
    });

    try {
      // Extract citations from content using production NLP service
      const extractionResult = await this.citationExtractionService.extractCitations(content);

      if (extractionResult.citations.length === 0) {
        this.logger.warn(`No citations found in content [${verificationId}]`);
        return {
          contentSummary: {
            title: content.title || 'Untitled Content',
            citationCount: 0,
          },
          citations: [],
          overallCredibilityScore: 0,
          segment,
          extractionResult,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        };
      }

      // Verify each citation with production APIs
      const verificationResults = await Promise.all(
        extractionResult.citations.map(citation => this.verifySingleCitationProduction(citation, segment))
      );

      // Calculate overall credibility score
      const overallScore = this.calculateOverallCredibility(verificationResults);

      const result = {
        contentSummary: {
          title: content.title || 'Untitled Content',
          citationCount: extractionResult.citations.length,
        },
        citations: verificationResults,
        overallCredibilityScore: overallScore,
        segment,
        extractionResult,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      };

      this.appInsights.trackEvent('CitationVerification:Success', {
        verificationId,
        citationsFound: extractionResult.citations.length,
        overallScore,
        processingTime: result.processingTime
      });

      return result;

    } catch (error) {
      this.logger.error(`Citation verification failed [${verificationId}]: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        verificationId,
        segment,
        operation: 'CitationVerification'
      });

      // Return fallback result
      return {
        contentSummary: {
          title: content.title || 'Untitled Content',
          citationCount: 0,
        },
        citations: [],
        overallCredibilityScore: 0,
        segment,
        error: error.message,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Enhances content with more authoritative citations
   * @param content Content to enhance
   * @param segment B2B or B2C segment
   */
  async enhanceCitationAuthority(content: any, segment: 'b2b' | 'b2c'): Promise<any> {
    console.log(`Enhancing citation authority for ${segment} content`);
    
    // Original verification results
    const originalVerification = await this.verifyCitations(content, segment);
    
    // Enhanced content with improved citations
    const enhancedContent = { ...content };
    
    // Replace weak citations with stronger ones and add missing citations
    const enhancedCitations = await this.generateEnhancedCitations(
      originalVerification.citations,
      segment
    );
    
    // Apply citation improvements to content
    if (enhancedContent.sections) {
      Object.keys(enhancedContent.sections).forEach(sectionKey => {
        // Find relevant enhanced citations for this section
        const sectionCitations = enhancedCitations.filter(
          citation => citation.section === sectionKey
        );
        
        if (sectionCitations.length > 0) {
          // Update section with enhanced citations
          const sectionContent = enhancedContent.sections[sectionKey];
          
          enhancedContent.sections[sectionKey] = {
            ...sectionContent,
            citations: sectionCitations,
            content: this.integrateCitationsIntoContent(
              sectionContent.content,
              sectionCitations
            ),
          };
        }
      });
    }
    
    // Re-verify the enhanced content
    const enhancedVerification = await this.verifyCitations(enhancedContent, segment);
    
    return {
      originalContent: content,
      enhancedContent,
      originalVerification,
      enhancedVerification,
      improvementSummary: {
        citationCount: {
          before: originalVerification.contentSummary.citationCount,
          after: enhancedVerification.contentSummary.citationCount,
        },
        credibilityScore: {
          before: originalVerification.overallCredibilityScore,
          after: enhancedVerification.overallCredibilityScore,
          improvement: (
            enhancedVerification.overallCredibilityScore - 
            originalVerification.overallCredibilityScore
          ).toFixed(2),
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Generates a citation strategy based on topic and audience
   * @param topic Content topic
   * @param segment B2B or B2C segment
   */
  async generateCitationStrategy(topic: string, segment: 'b2b' | 'b2c'): Promise<any> {
    console.log(`Generating citation strategy for ${topic} (${segment})`);
    
    // Different citation strategies based on segment
    const recommendedSources = segment === 'b2b' 
      ? [
          'Industry research reports',
          'Academic papers',
          'Technical documentation',
          'Case studies',
          'Industry standards bodies',
        ]
      : [
          'Consumer research studies',
          'Expert opinions',
          'Trusted media publications',
          'Government/official sources',
          'User surveys and data',
        ];
    
    const citationFormats = segment === 'b2b'
      ? ['IEEE', 'APA', 'Industry-specific', 'Technical whitepaper']
      : ['APA', 'Chicago', 'Hyperlinked', 'Footnoted'];
    
    // Generate authority hierarchy for this topic and segment
    const authorityHierarchy = this.generateAuthorityHierarchy(topic, segment);
    
    return {
      topic,
      segment,
      recommendedSources,
      preferredFormats: citationFormats,
      authorityHierarchy,
      densityRecommendation: {
        minimumCitations: segment === 'b2b' ? 2 : 1,
        recommendedCitationsPerSection: segment === 'b2b' ? 3 : 2,
        keyClaimRequirement: 'All significant claims require citation',
      },
      visualPresentation: {
        inlineStyle: segment === 'b2b' ? 'Numbered references' : 'Hyperlinked text',
        referenceSection: segment === 'b2b' ? 'Required' : 'Optional',
        citationHighlighting: segment === 'b2b' ? 'Subtle' : 'Noticeable but unobtrusive',
      },
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Production citation verification using external APIs and caching
   */
  private async verifySingleCitationProduction(citation: ExtractedCitation, segment: string): Promise<CitationVerificationResult> {
    const verificationId = `verify-single-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    try {
      // Check cache first
      const cacheKey = `${citation.url || citation.doi || citation.text.substring(0, 100)}-${segment}`;
      const cachedResult = await this.citationCacheService.getCitationVerification(cacheKey);

      if (cachedResult) {
        this.logger.debug(`Using cached verification for citation ${citation.id} [${verificationId}]`);
        return cachedResult;
      }

      const verification: any = {};
      const issues: string[] = [];
      const suggestions: string[] = [];
      const metadata: any = {
        verifiedAt: new Date().toISOString(),
        verificationMethod: 'production-api',
        apiResponses: {}
      };

      // Verify URL if present
      if (citation.url) {
        const urlValidation = await this.externalApiService.validateUrl(citation.url);
        verification.urlValid = urlValidation.isValid && urlValidation.isAccessible;

        if (!verification.urlValid) {
          issues.push(`URL not accessible: ${urlValidation.errors.join(', ')}`);
          suggestions.push('Verify the URL is correct and accessible');
        }

        metadata.apiResponses.urlValidation = urlValidation;

        // Get domain authority if URL is valid
        if (verification.urlValid) {
          const domain = new URL(citation.url).hostname;
          const domainAuthority = await this.getDomainAuthorityWithFallback(domain);

          if (domainAuthority) {
            verification.authorityScore = this.mapDomainAuthorityToScore(domainAuthority);
            metadata.apiResponses.domainAuthority = domainAuthority;
          } else {
            verification.authorityScore = this.calculateHeuristicAuthorityScore(domain);
            suggestions.push('Consider using sources with verified domain authority');
          }
        } else {
          verification.authorityScore = 0;
        }
      }

      // Verify DOI if present
      if (citation.doi) {
        const doiVerification = await this.externalApiService.verifyDoi(citation.doi);
        verification.doiValid = doiVerification.valid;

        if (verification.doiValid) {
          verification.authorityScore = Math.max(verification.authorityScore || 0, 8); // DOIs are generally high authority
          metadata.apiResponses.doiVerification = doiVerification;
        } else {
          issues.push('DOI could not be verified');
          suggestions.push('Check DOI format and validity');
        }
      }

      // Calculate other verification scores based on segment and citation properties
      verification.sourceReputation = await this.calculateSourceReputation(citation, segment);
      verification.recency = this.calculateRecencyScore(citation);
      verification.relevanceScore = await this.calculateRelevanceScore(citation, segment);

      // Add segment-specific verification
      if (segment === 'b2b') {
        verification.methodologyRigor = await this.assessMethodologyRigor(citation);
        verification.industryRelevance = await this.assessIndustryRelevance(citation);
      } else {
        verification.audienceRelevance = await this.assessAudienceRelevance(citation);
        verification.claimVerification = await this.assessClaimVerification(citation);
      }

      // Calculate overall score
      const scores = Object.values(verification).filter(v => typeof v === 'number') as number[];
      const overallScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

      const result: CitationVerificationResult = {
        citation,
        verification,
        overallScore: parseFloat(overallScore.toFixed(2)),
        verificationStatus: overallScore > 8 ? 'high_authority' :
                           (overallScore > 6 ? 'moderate_authority' : 'low_authority'),
        issues,
        suggestions,
        metadata
      };

      // Cache the result
      await this.citationCacheService.setCitationVerification(cacheKey, result);

      return result;

    } catch (error) {
      this.logger.error(`Single citation verification failed [${verificationId}]: ${error.message}`, error.stack);

      // Return fallback verification
      return {
        citation,
        verification: {
          sourceReputation: 5,
          recency: 5,
          authorityScore: 5,
          relevanceScore: 5
        },
        overallScore: 5,
        verificationStatus: 'unverified',
        issues: ['Verification failed due to technical error'],
        suggestions: ['Manual verification recommended'],
        metadata: {
          verifiedAt: new Date().toISOString(),
          verificationMethod: 'fallback',
          error: error.message
        }
      };
    }
  }
  
  private generateSampleCitationText(): string {
    const citationTexts = [
      "According to industry research...",
      "A recent study found that...",
      "Experts in the field suggest...",
      "Data from multiple sources indicates...",
      "Research published in the Journal of...",
      "Analysis by leading organizations shows...",
    ];
    
    return citationTexts[Math.floor(Math.random() * citationTexts.length)];
  }
  
  private generateSampleSource(): string {
    const sources = [
      "Journal of Digital Marketing",
      "Harvard Business Review",
      "Forrester Research",
      "Gartner",
      "MIT Technology Review",
      "Stanford AI Lab",
      "Content Marketing Institute",
      "Nielsen Consumer Research",
      "Pew Research Center",
      "McKinsey Global Institute",
    ];
    
    return sources[Math.floor(Math.random() * sources.length)];
  }
  
  private async verifySingleCitation(citation: any, segment: string): Promise<any> {
    // In production, this would verify the actual citation using external APIs
    
    // Mock verification with different criteria based on segment
    const verificationCriteria = segment === 'b2b' 
      ? [
          'source_reputation',
          'recency',
          'methodology_rigor',
          'industry_relevance',
          'data_sample_size',
        ]
      : [
          'source_reputation',
          'recency',
          'author_expertise',
          'audience_relevance',
          'claim_verification',
        ];
    
    const verificationResults = {};
    verificationCriteria.forEach(criterion => {
      verificationResults[criterion] = {
        score: parseFloat((0.5 + Math.random() * 0.5).toFixed(2)), // 0.50-1.00
        notes: `Automated verification of ${criterion}`,
      };
    });
    
    // Calculate overall score for this citation
    let totalScore = 0;
    let validResults = 0;
    
    // Safely calculate the sum of scores
    Object.values(verificationResults).forEach((result: any) => {
      if (typeof result.score === 'number') {
        totalScore += result.score;
        validResults++;
      }
    });
    
    // Calculate average score, defaulting to 0 if no valid results
    const overallScore = validResults > 0 ? totalScore / validResults : 0;
    
    return {
      ...citation,
      verification: verificationResults,
      overallScore: parseFloat(overallScore.toFixed(2)),
      verificationStatus: overallScore > 0.8 ? 'high_authority' :
                         (overallScore > 0.6 ? 'moderate_authority' : 'low_authority'),
      segment,
    };
  }
  
  private calculateOverallCredibility(verificationResults: any[]): number {
    if (verificationResults.length === 0) return 0;
    
    const totalScore = verificationResults
      .reduce((sum, result) => sum + result.overallScore, 0);
      
    return parseFloat((totalScore / verificationResults.length).toFixed(2));
  }
  
  private async generateEnhancedCitations(originalCitations: any[], segment: string): Promise<any[]> {
    // In production, this would use AI to actually enhance citations
    
    // Enhanced citations - keep high authority ones, replace low authority ones
    return originalCitations.map(citation => {
      // Keep high authority citations
      if (citation.verificationStatus === 'high_authority') {
        return citation;
      }
      
      // Enhance low and moderate citations
      const enhancedCitation = { ...citation };
      
      // Update source to more authoritative one based on segment
      if (segment === 'b2b') {
        enhancedCitation.source = [
          'Harvard Business Review',
          'Gartner',
          'McKinsey Global Institute',
          'MIT Technology Review',
          'IEEE Spectrum',
        ][Math.floor(Math.random() * 5)];
      } else {
        enhancedCitation.source = [
          'Nielsen Consumer Research',
          'Pew Research Center',
          'Journal of Consumer Psychology',
          'Consumer Reports',
          'National Institutes of Health',
        ][Math.floor(Math.random() * 5)];
      }
      
      // Update year to more recent
      enhancedCitation.year = 2024 + Math.floor(Math.random() * 2); // 2024-2025
      
      // Mark as enhanced
      enhancedCitation.enhanced = true;
      
      return enhancedCitation;
    });
  }
  
  private integrateCitationsIntoContent(content: string, citations: any[]): string {
    // In production, this would intelligently integrate citations into the content
    
    // Mock implementation - add citation references at the end
    let enhancedContent = content;
    
    // Add citation reference section
    enhancedContent += '\n\n**References:**\n';
    
    citations.forEach((citation, index) => {
      enhancedContent += `\n${index + 1}. ${citation.source} (${citation.year}). "${citation.text.replace(/\.\.\.$/, '')}" ${citation.url}`;
    });
    
    return enhancedContent;
  }
  
  /**
   * Get domain authority with fallback to multiple services
   */
  private async getDomainAuthorityWithFallback(domain: string): Promise<DomainAuthorityResult | null> {
    // Check cache first
    const cachedResult = await this.citationCacheService.getDomainAuthority(domain);
    if (cachedResult) {
      return cachedResult;
    }

    // Try Moz first
    let result = await this.externalApiService.getMozDomainAuthority(domain);

    // Fallback to Ahrefs if Moz fails
    if (!result) {
      result = await this.externalApiService.getAhrefsDomainAuthority(domain);
    }

    // Cache the result if we got one
    if (result) {
      await this.citationCacheService.setDomainAuthority(domain, result);
    }

    return result;
  }

  /**
   * Map domain authority score (0-100) to verification score (0-10)
   */
  private mapDomainAuthorityToScore(domainAuthority: DomainAuthorityResult): number {
    let score = domainAuthority.authorityScore / 10; // Convert 0-100 to 0-10

    // Boost for special domain types
    if (domainAuthority.isGovernment) score = Math.min(10, score + 2);
    if (domainAuthority.isEducational) score = Math.min(10, score + 1.5);
    if (domainAuthority.isNews) score = Math.min(10, score + 1);

    return parseFloat(score.toFixed(1));
  }

  /**
   * Calculate heuristic authority score when API data is unavailable
   */
  private calculateHeuristicAuthorityScore(domain: string): number {
    const lowercaseDomain = domain.toLowerCase();

    // High authority domains
    const highAuthorityPatterns = [
      '.gov', '.edu', 'wikipedia.org', 'nature.com', 'science.org',
      'harvard.edu', 'mit.edu', 'stanford.edu', 'who.int', 'cdc.gov',
      'nih.gov', 'ieee.org', 'acm.org'
    ];

    for (const pattern of highAuthorityPatterns) {
      if (lowercaseDomain.includes(pattern)) {
        return 9;
      }
    }

    // Medium authority domains
    const mediumAuthorityPatterns = [
      'nytimes.com', 'bbc.com', 'theguardian.com', 'washingtonpost.com',
      'economist.com', 'reuters.com', 'ap.org', 'npr.org'
    ];

    for (const pattern of mediumAuthorityPatterns) {
      if (lowercaseDomain.includes(pattern)) {
        return 7;
      }
    }

    // Default score based on TLD
    if (lowercaseDomain.endsWith('.edu')) return 7;
    if (lowercaseDomain.endsWith('.gov')) return 8;
    if (lowercaseDomain.endsWith('.org')) return 6;
    if (lowercaseDomain.endsWith('.com')) return 5;

    return 4; // Default for unknown domains
  }

  /**
   * Calculate source reputation score
   */
  private async calculateSourceReputation(citation: ExtractedCitation, segment: string): Promise<number> {
    if (citation.source) {
      const reputationSources = segment === 'b2b'
        ? ['Harvard Business Review', 'Gartner', 'McKinsey', 'MIT Technology Review', 'IEEE']
        : ['Pew Research', 'Nielsen', 'Consumer Reports', 'Mayo Clinic', 'WebMD'];

      const isReputable = reputationSources.some(source =>
        citation.source?.toLowerCase().includes(source.toLowerCase())
      );

      return isReputable ? 9 : 6;
    }

    return 5; // Default when source is unknown
  }

  /**
   * Calculate recency score based on publication year
   */
  private calculateRecencyScore(citation: ExtractedCitation): number {
    if (!citation.year) return 5; // Default when year is unknown

    const currentYear = new Date().getFullYear();
    const age = currentYear - citation.year;

    if (age <= 1) return 10;
    if (age <= 2) return 9;
    if (age <= 3) return 8;
    if (age <= 5) return 7;
    if (age <= 10) return 6;

    return Math.max(1, 6 - Math.floor(age / 5)); // Decrease score for older sources
  }

  /**
   * Calculate relevance score using AI analysis
   */
  private async calculateRelevanceScore(citation: ExtractedCitation, segment: string): Promise<number> {
    try {
      const prompt = `
Analyze the relevance of this citation for ${segment} content:

Citation: ${citation.text}
Source: ${citation.source || 'Unknown'}
Type: ${citation.type}

Rate the relevance on a scale of 1-10 where:
- 10: Highly relevant and directly supports the content
- 7-9: Relevant with good supporting evidence
- 4-6: Somewhat relevant but tangential
- 1-3: Not relevant or off-topic

Return only a number between 1 and 10.
`;

      const response = await this.azureAIService.generateCompletion({
        prompt,
        maxTokens: 10,
        temperature: 0.1
      });

      const score = parseFloat(response.text.trim());
      return isNaN(score) ? 5 : Math.max(1, Math.min(10, score));

    } catch (error) {
      this.logger.warn(`Relevance score calculation failed: ${error.message}`);
      return 5; // Default score
    }
  }

  /**
   * Assess methodology rigor for B2B content
   */
  private async assessMethodologyRigor(citation: ExtractedCitation): Promise<number> {
    // Check for academic indicators
    if (citation.type === 'academic' || citation.doi) return 9;

    // Check for research methodology keywords
    const rigorousKeywords = ['study', 'research', 'analysis', 'survey', 'data', 'methodology'];
    const hasRigorousKeywords = rigorousKeywords.some(keyword =>
      citation.text.toLowerCase().includes(keyword)
    );

    return hasRigorousKeywords ? 7 : 5;
  }

  /**
   * Assess industry relevance for B2B content
   */
  private async assessIndustryRelevance(citation: ExtractedCitation): Promise<number> {
    const industryKeywords = ['business', 'industry', 'enterprise', 'corporate', 'professional'];
    const hasIndustryKeywords = industryKeywords.some(keyword =>
      citation.text.toLowerCase().includes(keyword) ||
      citation.source?.toLowerCase().includes(keyword)
    );

    return hasIndustryKeywords ? 8 : 6;
  }

  /**
   * Assess audience relevance for B2C content
   */
  private async assessAudienceRelevance(citation: ExtractedCitation): Promise<number> {
    const consumerKeywords = ['consumer', 'customer', 'user', 'people', 'public', 'individual'];
    const hasConsumerKeywords = consumerKeywords.some(keyword =>
      citation.text.toLowerCase().includes(keyword) ||
      citation.source?.toLowerCase().includes(keyword)
    );

    return hasConsumerKeywords ? 8 : 6;
  }

  /**
   * Assess claim verification for B2C content
   */
  private async assessClaimVerification(citation: ExtractedCitation): Promise<number> {
    // Higher score for fact-checked sources
    const factCheckSources = ['snopes', 'factcheck.org', 'politifact', 'reuters fact check'];
    const isFactChecked = factCheckSources.some(source =>
      citation.url?.toLowerCase().includes(source) ||
      citation.source?.toLowerCase().includes(source)
    );

    return isFactChecked ? 10 : 6;
  }

  private generateAuthorityHierarchy(topic: string, segment: string): any {
    // Generate topic-specific authority hierarchy

    if (segment === 'b2b') {
      return {
        tier1: [
          'Peer-reviewed academic research',
          'Industry standards organizations',
          'Major research institutions',
        ],
        tier2: [
          'Industry analyst reports',
          'Technical documentation',
          'White papers from major vendors',
        ],
        tier3: [
          'Case studies',
          'Industry blogs from recognized experts',
          'Conference proceedings',
        ],
        tier4: [
          'Industry forums',
          'Company blogs',
          'Opinion pieces',
        ],
      };
    } else {
      return {
        tier1: [
          'Government health/safety agencies',
          'Major academic research institutions',
          'Peer-reviewed journals',
        ],
        tier2: [
          'Major consumer research organizations',
          'Established media with fact-checking',
          'Industry expert opinions',
        ],
        tier3: [
          'Smaller studies',
          'Expert blogs',
          'Industry publications',
        ],
        tier4: [
          'Consumer testimonials',
          'Social media',
          'Opinion content',
        ],
      };
    }
  }
}
