import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { GeneratedContent, ContentStatus, ContentSection } from './contentService';

// Define Azure-specific content section type
export interface AzureContentSection {
  id: string;
  title: string;
  content: string;
  order?: number;
  type?: string;
}

// Reuse the ApiResponse interface that was introduced in the previous fixes
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Azure Function service configuration
const azureFunctionsClient = axios.create({
  baseURL: process.env.REACT_APP_AZURE_FUNCTIONS_ENDPOINT || '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add the API key to requests when available
azureFunctionsClient.interceptors.request.use(config => {
  const apiKey = process.env.REACT_APP_AZURE_FUNCTIONS_KEY;
  if (apiKey) {
    config.headers['x-functions-key'] = apiKey;
  }
  return config;
});

// Logic App service for orchestrated workflows
const logicAppClient = axios.create({
  baseURL: process.env.REACT_APP_AZURE_LOGIC_APP_ENDPOINT || '/workflow',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add the API key to requests when available
logicAppClient.interceptors.request.use(config => {
  const apiKey = process.env.REACT_APP_AZURE_LOGIC_APP_KEY;
  if (apiKey) {
    config.headers['x-api-key'] = apiKey;
  }
  return config;
});

// Define interfaces for the request/response objects for Azure Functions
export interface QueryIntentRequest {
  query: string;
}

export interface QueryIntentResponse {
  originalQuery: string;
  entities: Array<{
    text: string;
    category: string;
    confidence: number;
  }>;
  keyPhrases: string[];
  intentAnalysis: {
    primaryIntent: string;
    topicCategory: string;
    queryVariations: string[];
  };
  timestamp: string;
}

export interface ContentGenerationRequest {
  title?: string;
  keywords?: string[];
  style?: string;
  targetAudience?: string;
  contentType: string;
  maxLength?: number;
  outputFormat?: string;
  topics?: string[];
  searchIntent?: string;
}

export interface ChunkContentRequest {
  content: string;
  contentId?: string;
  chunkingStrategy: 'paragraph' | 'semantic' | 'fixed' | 'heading';
  maxChunkSize?: number;
  overlap?: number;
}

export interface ContentOptimizationRequest {
  content: string;
  contentId?: string;
  optimizationGoals: string[];
  targetAudience?: string;
  searchIntent?: string;
  keywords?: string[];
  style?: string;
  maxLength?: number;
  enhanceWithResearch?: boolean;
  includeReferences?: boolean;
  version?: number;
}

export interface AuthorityAnalysisRequest {
  content: string;
  contentId?: string;
  url?: string;
  domain?: string;
  title?: string;
  author?: string;
  publicationDate?: string;
  contentType?: string;
}

export interface VectorSearchRequest {
  query: string;
  filters?: string;
  vectorQuery?: number[];
  top?: number;
  skip?: number;
  includeTotalCount?: boolean;
  searchMode?: 'vector' | 'semantic' | 'hybrid';
}

export interface WorkflowRequest {
  action: 'generate' | 'search';
  query?: string;
  title?: string;
  keywords?: string[];
  style?: string;
  targetAudience?: string;
  contentType?: string;
  maxLength?: number;
  outputFormat?: string;
  userId?: string;
}

// Azure Services wrapper class to interact with Azure Functions
class AzureServicesClass {
  // Helper method for executing GET requests with error handling
  private async executeGet<T>(client: AxiosInstance, url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await client.get<T>(url, config);
      return { data: response.data };
    } catch (error) {
      console.error(`Error executing GET request to ${url}:`, error);
      return {
        error: error instanceof Error ? error.message : 'An error occurred executing request'
      };
    }
  }

  // Helper method for executing POST requests with error handling
  private async executePost<T>(client: AxiosInstance, url: string, data: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await client.post<T>(url, data, config);
      return { data: response.data };
    } catch (error) {
      console.error(`Error executing POST request to ${url}:`, error);
      return {
        error: error instanceof Error ? error.message : 'An error occurred executing request'
      };
    }
  }

  // Query intent analyzer
  async analyzeQueryIntent(query: string): Promise<ApiResponse<QueryIntentResponse>> {
    return this.executePost<QueryIntentResponse>(azureFunctionsClient, '/analyze-intent', { query });
  }

  // Content chunker
  async chunkContent(request: ChunkContentRequest): Promise<ApiResponse<any>> {
    return this.executePost(azureFunctionsClient, '/chunk-content', request);
  }

  // Vector store operations
  async searchVectorStore(request: VectorSearchRequest): Promise<ApiResponse<any>> {
    return this.executePost(azureFunctionsClient, '/vector-store/search', request);
  }

  // Content optimization
  async optimizeContent(request: ContentOptimizationRequest): Promise<ApiResponse<any>> {
    return this.executePost(azureFunctionsClient, '/optimize-content', request);
  }

  // Authority signals
  async analyzeAuthority(request: AuthorityAnalysisRequest): Promise<ApiResponse<any>> {
    return this.executePost(azureFunctionsClient, '/analyze-authority', request);
  }

  // Orchestrated workflow through Logic App
  async executeWorkflow(request: WorkflowRequest): Promise<ApiResponse<any>> {
    return this.executePost(logicAppClient, '', request);
  }

  // Generate content through the orchestrated workflow
  async generateContent(request: ContentGenerationRequest): Promise<ApiResponse<GeneratedContent>> {
    try {
      const workflowRequest: WorkflowRequest = {
        action: 'generate',
        title: request.title,
        keywords: request.keywords,
        style: request.style,
        targetAudience: request.targetAudience,
        contentType: request.contentType,
        maxLength: request.maxLength,
        outputFormat: request.outputFormat
      };

      const response = await this.executeWorkflow(workflowRequest);
      
      if (response.error) {
        return { error: response.error };
      }
      
      // Transform the response to match expected GeneratedContent format
      return {
        data: this.transformContentResponse(response.data)
      };
    } catch (error) {
      console.error('Error generating content:', error);
      return {
        error: error instanceof Error ? error.message : 'An error occurred generating content'
      };
    }
  }

  // Check content generation status
  async getContentStatus(contentId: string): Promise<ApiResponse<ContentStatus>> {
    try {
      const response = await this.executeGet<any>(azureFunctionsClient, `/status/${contentId}`);
      
      if (response.error) {
        return { error: response.error };
      }
      
      // Process and adapt the response to match the expected ContentStatus interface
      const data = response.data || {};
      const contentStatus: ContentStatus = {
        id: contentId,
        status: (data.status as any) || 'processing',
        progress: typeof data.progress === 'number' ? data.progress : 0,
        estimatedCompletionTime: data.estimatedCompletionTime,
        error: data.error
      };
      
      return { data: contentStatus };
    } catch (error) {
      console.error('Error checking content status:', error);
      return {
        error: error instanceof Error ? error.message : 'An error occurred checking content status'
      };
    }
  }

  // Get generated content by ID
  async getContent(contentId: string): Promise<ApiResponse<GeneratedContent>> {
    try {
      const response = await this.executeGet(azureFunctionsClient, `/content/${contentId}`);
      
      if (response.error) {
        return { error: response.error };
      }
      
      return {
        data: this.transformContentResponse(response.data)
      };
    } catch (error) {
      console.error('Error getting content:', error);
      return {
        error: error instanceof Error ? error.message : 'An error occurred getting content'
      };
    }
  }
  
  // Update content sections
  async updateContent(contentId: string, sections: Array<AzureContentSection>): Promise<ApiResponse<GeneratedContent>> {
    try {
      const response = await this.executePost(
        azureFunctionsClient, 
        `/content/${contentId}/update`, 
        { sections }
      );
      
      if (response.error) {
        return { error: response.error };
      }
      
      return {
        data: this.transformContentResponse(response.data)
      };
    } catch (error) {
      console.error('Error updating content:', error);
      return {
        error: error instanceof Error ? error.message : 'An error occurred updating content'
      };
    }
  }

  // Helper to transform API response to GeneratedContent format
  private transformContentResponse(responseData: any): GeneratedContent {
    // Convert content from Azure to sections format for GeneratedContent
    const content = responseData?.content || responseData?.optimizedContent || '';
    const sections: ContentSection[] = [];
    
    // If content is available, create at least one default section
    if (content) {
      sections.push({
        id: '1',
        title: 'Main Content',
        content: content
      });
      
      // If the response already has sections, use those instead
      if (responseData?.sections && Array.isArray(responseData.sections)) {
        sections.length = 0; // Clear the default section
        responseData.sections.forEach((section: any) => {
          sections.push({
            id: section.id || String(sections.length + 1),
            title: section.title || `Section ${sections.length + 1}`,
            content: section.content || ''
          });
        });
      }
    }
    
    return {
      id: responseData?.contentId || responseData?.id || '',
      projectId: responseData?.projectId || '',
      title: responseData?.title || '',
      contentType: responseData?.contentType || 'article',
      summary: responseData?.summary || '',
      sections: sections,
      keywords: Array.isArray(responseData?.keywords) ? responseData.keywords : [],
      score: {
        overall: responseData?.optimizationScore?.overall?.score || responseData?.score?.overall || 0,
        readability: responseData?.optimizationScore?.readability?.score || responseData?.score?.readability || 0,
        seo: responseData?.optimizationScore?.keywordOptimization?.score || responseData?.score?.seo || 0,
        engagement: responseData?.optimizationScore?.engagementPotential?.score || responseData?.score?.engagement || 0
      },
      createdAt: responseData?.createdAt || new Date().toISOString(),
      updatedAt: responseData?.updatedAt || new Date().toISOString()
    };
  }
}

// Create and export a singleton instance
const AzureServices = new AzureServicesClass();
export default AzureServices;
