import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureAIService } from '../../../shared/services/azure-ai.service';

@Injectable()
export class OriginalResearchEngineService {
  constructor(
    private configService: ConfigService,
    private azureAIService: AzureAIService
  ) {}

  /**
   * Generates a research prompt based on the topic and content type
   * @param topic Topic for research
   * @param contentType Content type
   * @param segment B2B or B2C segment
   * @param searchResults Optional search results to incorporate
   * @returns Generated research prompt
   */
  private generateResearchPrompt(topic: string, contentType: string, segment: 'b2b' | 'b2c', searchResults: any = { value: [] }): string {
    const contextBuilder = [];
    
    // Add search results context if available
    if (searchResults.value && searchResults.value.length > 0) {
      const topResults = searchResults.value.slice(0, 3);
      contextBuilder.push('Based on the following information:');
      
      topResults.forEach((result: any, index: number) => {
        if (result.content) {
          contextBuilder.push(`Source ${index + 1}: ${result.content.substring(0, 200)}...`);
        }
      });
    }
    
    // Add segment-specific instructions
    if (segment === 'b2b') {
      contextBuilder.push(
        'Generate original business research data focused on industry insights, market trends, and professional use cases.'
      );
    } else {
      contextBuilder.push(
        'Generate original consumer research data focused on user behavior, preferences, and demographic insights.'
      );
    }
    
    // Add specific research instructions based on content type
    switch (contentType.toLowerCase()) {
      case 'blog':
      case 'article':
        contextBuilder.push('Format the data to include statistics and insights suitable for article citations.');
        break;
      case 'whitepaper':
      case 'report':
        contextBuilder.push('Include detailed methodology information and comprehensive data analysis suitable for in-depth reports.');
        break;
      case 'landing page':
      case 'product page':
        contextBuilder.push('Focus on value proposition metrics and competitive advantages that highlight key benefits.');
        break;
      default:
        contextBuilder.push('Provide balanced research data with key statistics and actionable insights.');
    }
    
    // Final prompt structure
    const prompt = `${contextBuilder.join('\n\n')}\n\n
      Please generate original research findings on "${topic}" for ${segment} audiences.
      
      FORMAT YOUR RESPONSE AS A JSON OBJECT with the following structure:
      {
        "researchType": "[type of research study]",
        "data": {
          [key data points and statistics as appropriate for the research type],
          "demographics": [demographic breakdown if relevant],
          "trends": [identified trends if relevant],
          "comparativeAnalysis": [comparative data if relevant]
        },
        "methodology": "[description of the research methodology]"
      }
      
      Ensure all data is presented with appropriate context and confidence levels.
    `;
    
    return prompt;
  }
  
  /**
   * Extracts research type from AI-generated text
   * @param text AI-generated text
   * @returns Research type or undefined if not found
   */
  private extractResearchType(text: string): string | undefined {
    const researchTypePatterns = [
      /research type[:\s]+([\w\s-]+)/i,
      /type of (research|study)[:\s]+([\w\s-]+)/i,
      /conducted (a|an) ([\w\s-]+) (research|study|analysis)/i,
      /([\w\s-]+) (research|study|analysis) was conducted/i
    ];
    
    for (const pattern of researchTypePatterns) {
      const match = text.match(pattern);
      if (match && match.length > 1) {
        // If the second capture group exists, use it, otherwise use the first capture group
        return match.length > 2 ? match[2].trim() : match[1].trim();
      }
    }
    
    return undefined;
  }
  
  /**
   * Extracts research data from AI-generated text
   * @param text AI-generated text
   * @param researchType Type of research
   * @returns Structured research data
   */
  private extractResearchData(text: string, researchType: string): any {
    const data: any = {};
    
    // Extract demographics if present
    const demographics = this.extractDemographicData(text);
    if (Object.keys(demographics).length > 0) {
      data.demographics = demographics;
    }
    
    // Extract trends if present
    const trends = this.extractTrendData(text);
    if (trends.length > 0) {
      data.trends = trends;
    }
    
    // Extract comparative analysis if present
    const comparativeAnalysis = this.extractComparativeData(text);
    if (Object.keys(comparativeAnalysis).length > 0) {
      data.comparativeAnalysis = comparativeAnalysis;
    }
    
    // Extract key findings based on research type
    const keyFindings = this.extractKeyFindings(text, researchType);
    if (keyFindings.length > 0) {
      data.keyFindings = keyFindings;
    }
    
    // If no structured data was found, create a simple representation
    if (Object.keys(data).length === 0) {
      data.summary = text.substring(0, 200) + '...';
      data.extractionNote = 'Limited structured data could be extracted from the AI response';
    }
    
    return data;
  }
  
  /**
   * Extracts methodology information from AI-generated text
   * @param text AI-generated text
   * @returns Methodology description or undefined if not found
   */
  private extractMethodology(text: string): string | undefined {
    const methodologyPatterns = [
      /methodology[:\s]+([^\n.]+)/i,
      /research method[:\s]+([^\n.]+)/i,
      /conducted using ([^\n.]+)/i,
      /based on ([^\n.]+) (methodology|approach|method)/i
    ];
    
    for (const pattern of methodologyPatterns) {
      const match = text.match(pattern);
      if (match && match.length > 1) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }
  
  /**
   * Extract demographic data from AI-generated text
   * @param text AI-generated text
   * @returns Structured demographic data
   */
  private extractDemographicData(text: string): any {
    const demographics: any = {};
    
    // Check for age group demographics
    const ageGroupPattern = /(\d+[-%]\d*\s*(?:of\s*)?(?:respondents|users|consumers|participants|people)?\s*(?:were|are|aged|in the age group|between)?\s*(?:aged\s*)?(?:between\s*)?(?:\d+[-–]\d+|\d+\+|\d+\s*(?:or|and)\s*(?:above|older|younger|under)))/gi;
    const ageMatches = text.match(ageGroupPattern);
    
    if (ageMatches && ageMatches.length > 0) {
      demographics.ageGroups = ageMatches.map(match => match.trim());
    }
    
    // Check for gender demographics
    const genderPattern = /(\d+[-%]\d*\s*(?:of\s*)?(?:respondents|users|consumers|participants|people)?\s*(?:were|are|identified as)\s*(?:male|female|non-binary|other))/gi;
    const genderMatches = text.match(genderPattern);
    
    if (genderMatches && genderMatches.length > 0) {
      demographics.gender = genderMatches.map(match => match.trim());
    }
    
    // Check for income or organization size demographics
    const incomePattern = /(\d+[-%]\d*\s*(?:of\s*)?(?:respondents|users|consumers|participants|people|organizations|companies)?\s*(?:were|are|had|have|reported|with)\s*(?:income|revenue|employees|size|budget)\s*(?:of|over|under|between)?\s*(?:\$?\d+[kmbt]?\+?|\$?\d+[kmbt]?[-–]\$?\d+[kmbt]?))/gi;
    const incomeMatches = text.match(incomePattern);
    
    if (incomeMatches && incomeMatches.length > 0) {
      demographics.income = incomeMatches.map(match => match.trim());
    }
    
    // Check for geographic demographics
    const geoPattern = /(\d+[-%]\d*\s*(?:of\s*)?(?:respondents|users|consumers|participants|people)?\s*(?:were|are|from|located in|reside in|based in)\s*(?:North America|USA|Europe|Asia|Africa|South America|Australia|specific regions|urban areas|rural areas))/gi;
    const geoMatches = text.match(geoPattern);
    
    if (geoMatches && geoMatches.length > 0) {
      demographics.geography = geoMatches.map(match => match.trim());
    }
    
    return demographics;
  }
  
  /**
   * Extract trend data from AI-generated text
   * @param text AI-generated text
   * @returns Array of trend information
   */
  private extractTrendData(text: string): any[] {
    const trends: any[] = [];
    
    // Look for trend patterns in the text
    const trendPatterns = [
      /(increase[sd]|decrease[sd]|grew|declined|rose|fell|surge[sd]|drop[ps]?ed|climbing|falling) (by|to|from) (\d+[.,]?\d*[%]?)/gi,
      /(\d+[.,]?\d*[%]?)\s*(increase|decrease|growth|decline|rise|fall|surge|drop)/gi,
      /(upward|downward|rising|declining|growing)\s*trend/gi,
      /trend(?:s|ing)?\s*(?:show(?:s|ing|ed)?|indicate[sd]?|suggest[s]?|point[s]? to)\s*([^.,;]+)/gi
    ];
    
    // Process each trend pattern
    trendPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        // Extract the full matched phrase
        const trendText = match[0].trim();
        if (trendText && !trends.includes(trendText)) {
          trends.push(trendText);
        }
      }
    });
    
    // Look for specific year-over-year or period comparisons
    const yearComparisonPattern = /(?:year[- ]over[- ]year|YoY|year[- ]on[- ]year|compared to (?:last|previous) (?:year|quarter|month)|\d{4}\s*(?:to|vs\.?)\s*\d{4})[^.,;]{3,50}/gi;
    const yearMatches = text.match(yearComparisonPattern);
    
    if (yearMatches) {
      yearMatches.forEach(match => {
        const trendText = match.trim();
        if (!trends.includes(trendText)) {
          trends.push(trendText);
        }
      });
    }
    
    return trends;
  }
  
  /**
   * Extract comparative analysis data from AI-generated text
   * @param text AI-generated text
   * @returns Structured comparative data
   */
  private extractComparativeData(text: string): any {
    const comparative: any = {};
    
    // Look for comparison sections
    const comparisonSectionPattern = /(comparison|comparative analysis|vs\.|versus)[^.]*\./gi;
    const sections = text.match(comparisonSectionPattern);
    
    if (sections && sections.length > 0) {
      comparative.sections = sections.map(section => section.trim());
    }
    
    // Look for entity comparisons
    const entityPattern = /([\w\s]+) (?:outperform(?:s|ed)?|exceed(?:s|ed)?|surpass(?:es|ed)?|better than|worse than|compared to|versus) ([\w\s]+) (?:by|with|at) ([^.,;]+)/gi;
    const entities: any[] = [];
    
    const entityMatches = text.matchAll(entityPattern);
    for (const match of entityMatches) {
      if (match.length >= 4) {
        entities.push({
          entity1: match[1].trim(),
          entity2: match[2].trim(),
          comparisonMetric: match[3].trim(),
          fullText: match[0].trim()
        });
      }
    }
    
    if (entities.length > 0) {
      comparative.entityComparisons = entities;
    }
    
    // Extract percentage comparisons
    const percentPattern = /(\d+[.,]?\d*%)\s*(?:more|less|higher|lower|better|worse|greater|smaller)\s*than/gi;
    const percentMatches = text.match(percentPattern);
    
    if (percentMatches && percentMatches.length > 0) {
      comparative.percentageComparisons = percentMatches.map(match => match.trim());
    }
    
    return comparative;
  }
  
  /**
   * Extract key findings from AI-generated text
   * @param text AI-generated text
   * @param researchType Type of research conducted
   * @returns Array of key findings
   */
  private extractKeyFindings(text: string, researchType: string): string[] {
    const findings: string[] = [];
    
    // Look for explicit key findings sections
    const keyFindingSections = [
      /key findings?[:\s]+([^\n]+)/gi,
      /main results?[:\s]+([^\n]+)/gi,
      /findings? showed that[:\s]+([^\n]+)/gi,
      /research (revealed|showed|indicated)[:\s]+([^\n]+)/gi
    ];
    
    // Extract explicit findings
    keyFindingSections.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Extract the finding portion after the pattern
          const findingText = match.replace(/key findings?[:\s]+|main results?[:\s]+|findings? showed that[:\s]+|research (revealed|showed|indicated)[:\s]+/gi, '').trim();
          if (findingText && !findings.includes(findingText)) {
            findings.push(findingText);
          }
        });
      }
    });
    
    // Look for bullet points or numbered findings
    const bulletPattern = /(•|\*|\d+\.)\s*([^\n•*\d][^\n]+)/gi;
    const bulletMatches = text.matchAll(bulletPattern);
    
    for (const match of bulletMatches) {
      if (match[2]) {
        const finding = match[2].trim();
        if (finding && !findings.includes(finding) && finding.length > 10) {
          findings.push(finding);
        }
      }
    }
    
    // If we still don't have any findings, try to extract sentences with percentages or statistics
    if (findings.length === 0) {
      const statsPattern = /[^.!?]*\d+[.,]?\d*%[^.!?]*/g;
      const statsMatches = text.match(statsPattern);
      
      if (statsMatches) {
        statsMatches.forEach(match => {
          const finding = match.trim();
          if (finding && !findings.includes(finding) && finding.length > 10 && finding.length < 200) {
            findings.push(finding);
          }
        });
      }
    }
    
    // Extract the most relevant findings based on research type if we have too many
    if (findings.length > 5) {
      // Prioritize findings relevant to the research type
      const prioritized = findings.filter(finding => {
        const lowerFinding = finding.toLowerCase();
        const lowerType = researchType.toLowerCase();
        return lowerFinding.includes(lowerType) || 
               (lowerType.includes('survey') && lowerFinding.includes('respondent')) || 
               (lowerType.includes('analysis') && (lowerFinding.includes('analysis') || lowerFinding.includes('compared')));
      });
      
      // Use prioritized findings or just take the top 5 if we couldn't prioritize
      return prioritized.length > 0 ? prioritized.slice(0, 5) : findings.slice(0, 5);
    }
    
    return findings;
  }
  
  /**
   * Generates original research data for content
   * @param topic Topic to generate research for
   * @param contentType Type of content
   * @param segment B2B or B2C segment
   */
  async generateOriginalResearch(topic: string, contentType: string, segment: 'b2b' | 'b2c'): Promise<any> {
    console.log(`Generating original research for ${segment} content on topic: ${topic}`);
    
    try {
      // Define research types based on segment
      const researchTypes = segment === 'b2b' 
        ? ['industry survey', 'comparative analysis', 'case study', 'market forecast']
        : ['consumer survey', 'usage statistics', 'demographic analysis', 'trend analysis'];
      
      // First, search for relevant data points using Azure Search
      const searchQuery = `${topic} ${segment === 'b2b' ? 'business industry' : 'consumer'} research data statistics`;
      let searchResults;
      
      try {
        searchResults = await this.azureAIService.search(searchQuery, 'content-index');
        console.log('Research search results retrieved from Azure AI');
      } catch (error) {
        console.error('Error searching for research data:', error);
        searchResults = { value: [] };
      }
      
      // Generate a research prompt based on the topic and content type
      const researchPrompt = this.generateResearchPrompt(topic, contentType, segment, searchResults);
      
      // Use Azure AI to generate original research data
      const researchOptions = {
        maxTokens: 1000,
        temperature: 0.4,
        systemMessage: 'You are an expert research analyst specializing in data generation and analysis.'
      };
      
      const aiCompletionResult = await this.azureAIService.generateCompletion(researchPrompt, researchOptions);
      
      // Parse AI-generated research data
      // For robustness, we'll attempt to parse structured data but provide fallbacks
      let researchData;
      const researchText = aiCompletionResult.choices[0].text;
      
      try {
        // Try to parse JSON if the response is formatted properly
        if (researchText.includes('{\'') || researchText.includes('"')) {
          const jsonStart = researchText.indexOf('{');
          const jsonEnd = researchText.lastIndexOf('}') + 1;
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonStr = researchText.substring(jsonStart, jsonEnd);
            researchData = JSON.parse(jsonStr);
          }
        }
      } catch (error) {
        console.error('Error parsing research JSON:', error);
      }
      
      // If JSON parsing failed, extract structured information from the text
      if (!researchData) {
        // Select random research type if not determined from AI output
        const selectedType = researchTypes[Math.floor(Math.random() * researchTypes.length)];
        
        researchData = {
          researchType: this.extractResearchType(researchText) || selectedType,
          data: this.extractResearchData(researchText, selectedType),
          methodology: this.extractMethodology(researchText) || 'AI-assisted data analysis',
        };
      }
      
      // Generate embeddings for the research data for later semantic search
      const researchTextForEmbedding = JSON.stringify(researchData);
      let embeddings;
      
      try {
        embeddings = await this.azureAIService.generateEmbeddings(researchTextForEmbedding);
      } catch (error) {
        console.error('Error generating embeddings for research data:', error);
      }
      
      return {
        researchType: researchData.researchType || researchTypes[Math.floor(Math.random() * researchTypes.length)],
        topic,
        segment,
        contentType,
        data: researchData.data || {},
        methodology: researchData.methodology || 'AI-assisted research generation',
        aiGenerated: true,
        embeddings,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating research with Azure AI:', error);
      
      // Fallback to mock implementation if AI generation fails
      console.log('Falling back to mock research generation');
      
      // Mock implementation with differentiated research types based on segment
      const researchTypes = segment === 'b2b' 
        ? ['industry survey', 'comparative analysis', 'case study', 'market forecast']
        : ['consumer survey', 'usage statistics', 'demographic analysis', 'trend analysis'];
      
      // Select random research type for the mock
      const selectedType = researchTypes[Math.floor(Math.random() * researchTypes.length)];
      
      // Generate mock data based on the selected type and segment
      const mockData = {};
      
      if (selectedType === 'industry survey' || selectedType === 'consumer survey') {
        mockData['sampleSize'] = Math.floor(segment === 'b2b' ? 100 + Math.random() * 900 : 500 + Math.random() * 1500);
        mockData['keyFindings'] = [
          `${Math.floor(50 + Math.random() * 40)}% of respondents reported increased adoption`,
          `${Math.floor(20 + Math.random() * 30)}% cited cost as a major concern`,
          `${Math.floor(60 + Math.random() * 30)}% expressed interest in advanced features`
        ];
      } else if (selectedType === 'comparative analysis') {
        mockData['comparisonFactors'] = ['cost', 'efficiency', 'scalability', 'implementation time'];
        mockData['entities'] = ['Solution A', 'Solution B', 'Solution C'];
        mockData['topPerformer'] = 'Solution B';
      } else if (selectedType === 'demographic analysis') {
        mockData['ageGroups'] = {
          '18-24': `${Math.floor(10 + Math.random() * 20)}%`,
          '25-34': `${Math.floor(20 + Math.random() * 30)}%`,
          '35-44': `${Math.floor(15 + Math.random() * 25)}%`,
          '45-54': `${Math.floor(10 + Math.random() * 20)}%`,
          '55+': `${Math.floor(5 + Math.random() * 15)}%`
        };
        mockData['primaryDemographic'] = '25-34';
      } else if (selectedType === 'trend analysis') {
        mockData['trends'] = [
          { name: 'Mobile usage', growth: `${Math.floor(10 + Math.random() * 30)}%` },
          { name: 'Social commerce', growth: `${Math.floor(20 + Math.random() * 40)}%` },
          { name: 'Voice search', growth: `${Math.floor(30 + Math.random() * 50)}%` }
        ];
        mockData['prediction'] = 'Continued growth in voice search adoption';
      }
      
      return {
        researchType: selectedType,
        topic,
        segment,
        contentType,
        data: mockData,
        methodology: 'Generated data (fallback method)',
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  /**
   * Integrates original research into existing content
   * @param content Content to enhance with research
   * @param researchData Research data to integrate
   */
  async integrateResearchIntoContent(content: any, researchData: any): Promise<any> {
    console.log('Integrating research data into content');
    
    // Mock implementation
    const enhancedContent = { ...content };
    
    // Add research highlights section
    enhancedContent.researchHighlights = {
      title: `Original Research: ${researchData.topic}`,
      keyFindings: researchData.insights.slice(0, 3),
      methodology: researchData.methodology,
      dataVisualizations: researchData.visualizations,
    };
    
    // Integrate data points into appropriate sections
    if (enhancedContent.sections) {
      Object.keys(enhancedContent.sections).forEach(sectionKey => {
        // Randomly assign data points to relevant sections
        if (Math.random() > 0.6) {
          const relevantDataPoints = researchData.dataPoints
            .filter(() => Math.random() > 0.5)
            .slice(0, 2);
            
          if (relevantDataPoints.length > 0) {
            enhancedContent.sections[sectionKey] = {
              ...enhancedContent.sections[sectionKey],
              researchData: relevantDataPoints,
              originalResearchFlag: true,
            };
          }
        }
      });
    }
    
    return {
      originalContent: content,
      enhancedContent,
      integratedResearch: researchData,
      integrationPoints: this.getIntegrationPoints(enhancedContent),
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Evaluates content for research gap opportunities
   * @param content Content to analyze
   * @param segment B2B or B2C segment
   */
  async identifyResearchGaps(content: any, segment: 'b2b' | 'b2c'): Promise<any> {
    console.log(`Identifying research gaps for ${segment} content`);
    
    // Mock implementation - identify areas where original research would strengthen content
    const analyzeContentSections = (sections: any): any[] => {
      if (!sections) return [];
      
      return Object.keys(sections).map(sectionKey => {
        const gapScore = Math.random(); // 0-1 score of research gap
        return {
          section: sectionKey,
          gapScore: parseFloat(gapScore.toFixed(2)),
          gapSeverity: gapScore < 0.3 ? 'low' : (gapScore < 0.7 ? 'medium' : 'high'),
          researchOpportunities: this.getResearchOpportunities(segment, gapScore),
        };
      });
    };
    
    const gapAnalysis = analyzeContentSections(content.sections);
    
    const prioritizedGaps = [...gapAnalysis]
      .sort((a, b) => b.gapScore - a.gapScore)
      .slice(0, 3);
    
    return {
      contentSummary: {
        topic: content.title || 'Untitled Content',
        sectionCount: content.sections ? Object.keys(content.sections).length : 0,
      },
      gapAnalysis,
      prioritizedResearchOpportunities: prioritizedGaps,
      recommendedApproach: this.getRecommendedApproach(segment, prioritizedGaps),
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Generate data points for research based on segment
   * @param segment B2B or B2C segment
   * @param count Number of data points to generate
   * @returns Array of data points
   */
  private generateDataPoints(segment: string, count: number): any[] {
    const dataPoints = [];
    
    for (let i = 0; i < count; i++) {
      if (segment === 'b2b') {
        dataPoints.push({
          metric: ['ROI', 'Efficiency Gain', 'Implementation Success Rate', 'Cost Reduction', 'Time Saved'][i % 5],
          value: `${(Math.random() * 100).toFixed(1)}%`,
          context: 'Based on surveyed organizations in 2025',
          confidence: parseFloat((0.7 + Math.random() * 0.3).toFixed(2)),
        });
      } else {
        dataPoints.push({
          metric: ['Satisfaction Rating', 'Usage Frequency', 'Recommendation Rate', 'Perceived Value', 'Pain Point Reduction'][i % 5],
          value: `${(Math.random() * 10).toFixed(1)}/10`,
          context: 'Based on consumer survey data from Q2 2025',
          confidence: parseFloat((0.7 + Math.random() * 0.3).toFixed(2)),
        });
      }
    }
    
    return dataPoints;
  }
  
  /**
   * Generate visualization metadata for research
   * @param segment B2B or B2C segment
   * @returns Array of visualization metadata
   */
  private generateVisualizations(segment: string): any[] {
    // Mock visualization metadata - in production would generate actual charts
    const visualizationTypes = segment === 'b2b'
      ? ['comparison chart', 'trend analysis', 'implementation timeline']
      : ['satisfaction matrix', 'preference distribution', 'journey map'];
    
    return visualizationTypes.map(type => ({
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} for Key Metrics`,
      dataSource: 'Original research conducted in 2025',
      insightSummary: 'Reveals significant patterns in user behavior and preferences',
    }));
  }
  
  /**
   * Generate insights based on segment
   * @param segment B2B or B2C segment
   * @returns Array of insights
   */
  private generateInsights(segment: string): string[] {
    // Mock insights
    if (segment === 'b2b') {
      return [
        'Industry adoption is accelerating in the enterprise sector',
        'Cost remains the primary barrier to implementation',
        'Integration capabilities are a key differentiator for leading solutions'
      ];
    } else {
      return [
        'User engagement increases with personalized experiences',
        'Mobile usage dominates consumer interaction patterns',
        'Privacy concerns impact adoption among older demographics',
        'Pain point reduction was most significant in the 25-34 age demographic',
        'Usage frequency was 2.3x higher than competing products'
      ];
    }
  }
  
  /**
   * Get data sources based on segment
   * @param segment B2B or B2C segment
   * @returns Array of data source descriptions
   */
  private getDataSources(segment: string): string[] {
    if (segment === 'b2b') {
      return [
        'Industry survey (n=235)',
        'Implementation case studies (n=42)',
        'Technical performance metrics',
        'Financial ROI analysis',
      ];
    } else {
      return [
        'Consumer survey (n=412)',
        'Usage analytics data',
        'Sentiment analysis',
        'Comparative product testing',
      ];
    }
  }
  
  /**
   * Find integration points for research in content
   * @param content Content to analyze for integration points
   * @returns Array of integration point objects
   */
  private getIntegrationPoints(content: any): any[] {
    if (!content.sections) return [];
    
    return Object.keys(content.sections)
      .filter(section => content.sections[section].originalResearchFlag)
      .map(section => ({
        section,
        researchDataCount: content.sections[section].researchData?.length || 0,
        enhancementType: 'data-driven insights',
      }));
  }
  
  /**
   * Generate research opportunities based on segment and gap score
   * @param segment B2B or B2C segment
   * @param gapScore Gap severity score (0-1)
   * @returns Array of research opportunity descriptions
   */
  private getResearchOpportunities(segment: string, gapScore: number): string[] {
    const opportunities = [];
    
    if (segment === 'b2b') {
      if (gapScore > 0.7) opportunities.push('Conduct industry-specific ROI analysis');
      if (gapScore > 0.5) opportunities.push('Benchmark implementation metrics against competitors');
      if (gapScore > 0.3) opportunities.push('Survey technical decision makers on key criteria');
    } else {
      if (gapScore > 0.7) opportunities.push('Perform user satisfaction comparative study');
      if (gapScore > 0.5) opportunities.push('Analyze usage patterns across demographics');
      if (gapScore > 0.3) opportunities.push('Conduct preference testing for key features');
    }
    
    return opportunities;
  }
  
  /**
   * Generate recommended research approach based on segment and gap analysis
   * @param segment B2B or B2C segment
   * @param prioritizedGaps Array of prioritized research gaps
   * @returns Research approach recommendation object
   */
  private getRecommendedApproach(segment: string, prioritizedGaps: any[]): any {
    // Calculate average gap score
    const avgGapScore = prioritizedGaps.reduce((sum, gap) => sum + gap.gapScore, 0) / prioritizedGaps.length;
    
    // Recommend approach based on segment and average gap score
    if (segment === 'b2b') {
      return {
        researchType: avgGapScore > 0.6 ? 'Comprehensive Industry Analysis' : 'Targeted Benchmark Study',
        suggestedMethodology: avgGapScore > 0.6 ? 'Mixed methods (survey + interviews)' : 'Quantitative survey',
        estimatedSampleSize: avgGapScore > 0.6 ? '200-300 respondents' : '100-150 respondents',
        keyMetrics: prioritizedGaps.map(gap => gap.section),
      };
    } else {
      return {
        researchType: avgGapScore > 0.6 ? 'Comprehensive Consumer Study' : 'Targeted User Testing',
        suggestedMethodology: avgGapScore > 0.6 ? 'Mixed methods (survey + usability testing)' : 'Qualitative interviews',
        estimatedSampleSize: avgGapScore > 0.6 ? '350-500 respondents' : '50-100 respondents',
        keyMetrics: prioritizedGaps.map(gap => gap.section),
      };
    }
  }
}
