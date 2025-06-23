import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureAIService } from './azure-ai-service';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
import { ExtractedCitation, CitationExtractionResult } from './interfaces/citation-verification.interfaces';

@Injectable()
export class CitationExtractionService {
  private readonly logger = new Logger(CitationExtractionService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly azureAIService: AzureAIService,
    private readonly appInsights: ApplicationInsightsService
  ) {}

  /**
   * Extracts citations from content using NLP and pattern matching
   */
  async extractCitations(content: any): Promise<CitationExtractionResult> {
    const startTime = Date.now();
    const extractionId = `extract-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    this.logger.log(`Starting citation extraction for content: ${extractionId}`);
    this.appInsights.trackEvent('CitationExtraction:Start', {
      extractionId,
      contentLength: JSON.stringify(content).length
    });

    try {
      const citations: ExtractedCitation[] = [];
      let totalText = '';
      const sectionMap: Record<string, string> = {};

      // Extract text from content structure
      if (content && content.sections) {
        Object.keys(content.sections).forEach(sectionKey => {
          const sectionContent = content.sections[sectionKey];
          const text = typeof sectionContent === 'string' 
            ? sectionContent 
            : sectionContent.content || '';
          sectionMap[sectionKey] = text;
          totalText += `\n\n[SECTION:${sectionKey}]\n${text}`;
        });
      } else if (typeof content === 'string') {
        totalText = content;
        sectionMap['main'] = content;
      } else if (content && content.content) {
        totalText = content.content;
        sectionMap['main'] = content.content;
      }

      // Extract different types of citations
      const urlCitations = await this.extractUrlCitations(sectionMap);
      const doiCitations = await this.extractDoiCitations(sectionMap);
      const academicCitations = await this.extractAcademicCitations(sectionMap);
      const structuredCitations = await this.extractStructuredCitations(totalText);

      citations.push(...urlCitations, ...doiCitations, ...academicCitations, ...structuredCitations);

      // Remove duplicates and assign IDs
      const uniqueCitations = this.deduplicateCitations(citations);
      uniqueCitations.forEach((citation, index) => {
        citation.id = `citation-${extractionId}-${index + 1}`;
      });

      const result: CitationExtractionResult = {
        citations: uniqueCitations,
        totalFound: uniqueCitations.length,
        byType: this.groupByType(uniqueCitations),
        bySection: this.groupBySection(uniqueCitations),
        extractionMethod: 'hybrid-nlp-pattern',
        confidence: this.calculateExtractionConfidence(uniqueCitations, totalText),
        processingTime: Date.now() - startTime
      };

      this.logger.log(`Citation extraction completed: ${uniqueCitations.length} citations found`);
      this.appInsights.trackEvent('CitationExtraction:Success', {
        extractionId,
        citationsFound: uniqueCitations.length,
        processingTime: result.processingTime
      });

      return result;

    } catch (error) {
      this.logger.error(`Citation extraction failed: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        extractionId,
        operation: 'CitationExtraction'
      });

      // Return empty result on error
      return {
        citations: [],
        totalFound: 0,
        byType: {},
        bySection: {},
        extractionMethod: 'error-fallback',
        confidence: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Extract URL-based citations
   */
  private async extractUrlCitations(sectionMap: Record<string, string>): Promise<ExtractedCitation[]> {
    const citations: ExtractedCitation[] = [];
    const urlRegex = /(https?:\/\/[^\s\)]+)/gi;

    Object.keys(sectionMap).forEach(sectionKey => {
      const text = sectionMap[sectionKey];
      let match;
      
      while ((match = urlRegex.exec(text)) !== null) {
        const url = match[1];
        const position = { start: match.index, end: match.index + url.length };
        
        // Extract context around the URL
        const contextStart = Math.max(0, match.index - 100);
        const contextEnd = Math.min(text.length, match.index + url.length + 100);
        const context = text.substring(contextStart, contextEnd);

        citations.push({
          id: '', // Will be assigned later
          text: context.trim(),
          url: url,
          section: sectionKey,
          position: position,
          type: 'url'
        });
      }
    });

    return citations;
  }

  /**
   * Extract DOI-based citations
   */
  private async extractDoiCitations(sectionMap: Record<string, string>): Promise<ExtractedCitation[]> {
    const citations: ExtractedCitation[] = [];
    const doiRegex = /(?:doi:|DOI:|https?:\/\/(?:dx\.)?doi\.org\/)([^\s\)]+)/gi;

    Object.keys(sectionMap).forEach(sectionKey => {
      const text = sectionMap[sectionKey];
      let match;
      
      while ((match = doiRegex.exec(text)) !== null) {
        const doi = match[1];
        const position = { start: match.index, end: match.index + match[0].length };
        
        // Extract context around the DOI
        const contextStart = Math.max(0, match.index - 150);
        const contextEnd = Math.min(text.length, match.index + match[0].length + 150);
        const context = text.substring(contextStart, contextEnd);

        citations.push({
          id: '', // Will be assigned later
          text: context.trim(),
          doi: doi,
          url: `https://doi.org/${doi}`,
          section: sectionKey,
          position: position,
          type: 'doi'
        });
      }
    });

    return citations;
  }

  /**
   * Extract academic-style citations using pattern matching
   */
  private async extractAcademicCitations(sectionMap: Record<string, string>): Promise<ExtractedCitation[]> {
    const citations: ExtractedCitation[] = [];
    
    // Pattern for academic citations: Author(s) (Year). Title. Journal/Publisher.
    const academicRegex = /([A-Z][a-z]+(?:,?\s+[A-Z]\.?)*(?:\s+(?:and|&)\s+[A-Z][a-z]+(?:,?\s+[A-Z]\.?)*)*)\s*\((\d{4})\)\.\s*([^.]+)\.\s*([^.]+)\./g;

    Object.keys(sectionMap).forEach(sectionKey => {
      const text = sectionMap[sectionKey];
      let match;
      
      while ((match = academicRegex.exec(text)) !== null) {
        const [fullMatch, authors, year, title, source] = match;
        const position = { start: match.index, end: match.index + fullMatch.length };

        citations.push({
          id: '', // Will be assigned later
          text: fullMatch.trim(),
          authors: authors.split(/\s+(?:and|&)\s+/).map(author => author.trim()),
          year: parseInt(year),
          title: title.trim(),
          source: source.trim(),
          section: sectionKey,
          position: position,
          type: 'academic'
        });
      }
    });

    return citations;
  }

  /**
   * Extract structured citations using Azure AI
   */
  private async extractStructuredCitations(text: string): Promise<ExtractedCitation[]> {
    try {
      const prompt = `
You are an expert at extracting citations from academic and professional content. 
Analyze the following text and extract all citations, references, and source attributions.

For each citation found, identify:
1. The citation text
2. Type (academic paper, book, report, website, etc.)
3. Author(s) if mentioned
4. Year if mentioned
5. Title if mentioned
6. Source/publisher if mentioned

Text to analyze:
"""
${text.substring(0, 8000)}
"""

Return only a JSON array of citations in this format:
[
  {
    "text": "full citation text",
    "type": "academic|book|report|website|other",
    "authors": ["author1", "author2"],
    "year": 2023,
    "title": "title if available",
    "source": "journal/publisher if available"
  }
]
`;

      const response = await this.azureAIService.generateCompletion({
        prompt,
        maxTokens: 2000,
        temperature: 0.1
      });

      const citations = JSON.parse(response.text);
      return citations.map((citation: any, index: number) => ({
        id: '', // Will be assigned later
        text: citation.text,
        authors: citation.authors || [],
        year: citation.year,
        title: citation.title,
        source: citation.source,
        section: 'ai-extracted',
        position: { start: 0, end: 0 }, // AI extraction doesn't provide exact positions
        type: citation.type || 'other'
      }));

    } catch (error) {
      this.logger.warn(`AI citation extraction failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Remove duplicate citations
   */
  private deduplicateCitations(citations: ExtractedCitation[]): ExtractedCitation[] {
    const seen = new Set<string>();
    return citations.filter(citation => {
      const key = `${citation.url || citation.doi || citation.text.substring(0, 100)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Group citations by type
   */
  private groupByType(citations: ExtractedCitation[]): Record<string, number> {
    const groups: Record<string, number> = {};
    citations.forEach(citation => {
      groups[citation.type] = (groups[citation.type] || 0) + 1;
    });
    return groups;
  }

  /**
   * Group citations by section
   */
  private groupBySection(citations: ExtractedCitation[]): Record<string, number> {
    const groups: Record<string, number> = {};
    citations.forEach(citation => {
      groups[citation.section] = (groups[citation.section] || 0) + 1;
    });
    return groups;
  }

  /**
   * Calculate extraction confidence based on citation quality and patterns
   */
  private calculateExtractionConfidence(citations: ExtractedCitation[], text: string): number {
    if (citations.length === 0) return 0;

    let confidence = 0.5; // Base confidence

    // Increase confidence for structured citations
    const structuredCitations = citations.filter(c => c.url || c.doi || c.authors?.length);
    confidence += (structuredCitations.length / citations.length) * 0.3;

    // Increase confidence for diverse citation types
    const types = new Set(citations.map(c => c.type));
    confidence += (types.size / 5) * 0.2; // Max 5 types

    return Math.min(1, confidence);
  }
}
