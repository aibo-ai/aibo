import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { KeyVaultService } from '../../../common/services/key-vault.service';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
import { TextEmbeddingInput, TextGenerationInput, TextSearchInput, TextAnalysisInput } from './interfaces/azure-ai-inputs';

// Define output interfaces directly to avoid import issues
export interface TextGenerationOutput {
  text: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface TextSearchOutput {
  results: Array<{
    id: string;
    title?: string;
    content?: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
  count: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

export interface TextEmbeddingOutput {
  embeddings: number[][];
  dimensions: number;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface TextAnalysisOutput {
  kind: string;
  language: string;
  results: any;
  warnings?: string[];
  // Additional properties for specific analysis types
  entities?: Array<{
    text: string;
    category: string;
    offset: number;
    length: number;
    confidenceScore: number;
  }>;
  keyPhrases?: string[];
  sentiment?: string;
  confidenceScores?: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

@Injectable()
export class AzureAIService {
  private readonly logger = new Logger(AzureAIService.name);
  private azureOpenAiEndpoint: string;
  private azureOpenAiKey: string;
  private azureSearchEndpoint: string;
  private azureSearchKey: string;
  private azureSearchIndex: string;

  constructor(
    private readonly keyVaultService: KeyVaultService,
    private readonly appInsights: ApplicationInsightsService
  ) {
    this.azureOpenAiEndpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
    this.azureOpenAiKey = process.env.AZURE_OPENAI_KEY || '';
    this.azureSearchEndpoint = process.env.AZURE_SEARCH_ENDPOINT || '';
    this.azureSearchKey = process.env.AZURE_SEARCH_KEY || '';
    this.azureSearchIndex = process.env.AZURE_SEARCH_INDEX_NAME || 'content-index';

    if (!this.azureOpenAiEndpoint || !this.azureOpenAiKey) {
      this.logger.warn('Azure OpenAI credentials not configured properly');
    }

    if (!this.azureSearchEndpoint || !this.azureSearchKey) {
      this.logger.warn('Azure Cognitive Search credentials not configured properly');
    }
  }

  /**
   * Initialize Azure credentials from Key Vault or fallback to environment variables
   */
  async initializeCredentials(): Promise<void> {
    if (this.keyVaultService.isKeyVaultAvailable()) {
      this.logger.log('Retrieving Azure AI credentials from Key Vault');
      
      // Retrieve secrets from Key Vault (note: Key Vault uses dashes instead of underscores)
      const openAiKey = await this.keyVaultService.getSecret('AZURE-OPENAI-KEY');
      const searchKey = await this.keyVaultService.getSecret('AZURE-SEARCH-KEY');
      
      // Update credentials if found in Key Vault
      if (openAiKey) this.azureOpenAiKey = openAiKey;
      if (searchKey) this.azureSearchKey = searchKey;
      
      this.logger.log('Azure AI credentials updated from Key Vault');
    }
  }

  /**
   * Generate text completions using Azure OpenAI
   */
  async generateCompletion(input: TextGenerationInput): Promise<TextGenerationOutput> {
    // Start performance timer and prepare telemetry
    const startTime = Date.now();
    const operationId = `search-${Date.now()}`;
    
    // Track the request
    this.appInsights.trackEvent('AzureOpenAI:Completion:Start', {
      deploymentName: input.deploymentName || 'default',
      promptLength: input.prompt.length.toString()
    });
    
    try {
      // Initialize credentials from Key Vault if available
      await this.initializeCredentials();
      const { prompt, maxTokens = 1000, temperature = 0.7, deploymentName = 'gpt-35-turbo' } = input;
      
      // First try with chat completions API (newer models)
      try {
        this.logger.log(`Attempting to use chat completions API with deployment ${deploymentName}`);
        
        const chatResponse = await axios.post(
          `${this.azureOpenAiEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview'}`,
          {
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: maxTokens,
            temperature,
            n: 1,
            stream: false,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'api-key': this.azureOpenAiKey,
            },
          }
        );
        
        // Calculate performance metrics
        const duration = Date.now() - startTime;
        
        // Track successful completion
        this.appInsights.trackEvent('AzureOpenAI:ChatCompletion:Success', {
          deploymentName: input.deploymentName || 'gpt-35-turbo',
          durationMs: duration.toString(),
          totalTokens: chatResponse.data.usage.total_tokens.toString()
        });
        
        this.appInsights.trackMetric('AzureOpenAI:CompletionLatency', duration, {
          deploymentName: input.deploymentName || 'gpt-35-turbo',
          success: 'true'
        });
        
        return {
          text: chatResponse.data.choices[0].message.content,
          finishReason: chatResponse.data.choices[0].finish_reason,
          usage: {
            promptTokens: chatResponse.data.usage.prompt_tokens,
            completionTokens: chatResponse.data.usage.completion_tokens,
            totalTokens: chatResponse.data.usage.total_tokens,
          },
        };
      } catch (chatError) {
        // If chat completions fails, try legacy completions API
        this.logger.warn(`Chat completions API failed: ${chatError.message}. Falling back to completions API.`);
        
        const legacyResponse = await axios.post(
          `${this.azureOpenAiEndpoint}/openai/deployments/${deploymentName}/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview'}`,
          {
            prompt,
            max_tokens: maxTokens,
            temperature,
            n: 1,
            stream: false,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'api-key': this.azureOpenAiKey,
            },
          }
        );

        // Calculate performance metrics
        const duration = Date.now() - startTime;
        
        // Track successful completion
        this.appInsights.trackEvent('AzureOpenAI:LegacyCompletion:Success', {
          deploymentName: input.deploymentName || 'gpt-35-turbo',
          durationMs: duration.toString(),
          totalTokens: legacyResponse.data.usage.total_tokens.toString()
        });
        
        return {
          text: legacyResponse.data.choices[0].text,
          finishReason: legacyResponse.data.choices[0].finish_reason,
          usage: {
            promptTokens: legacyResponse.data.usage.prompt_tokens,
            completionTokens: legacyResponse.data.usage.completion_tokens,
            totalTokens: legacyResponse.data.usage.total_tokens,
          },
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track failed completion
      this.appInsights.trackException(error instanceof Error ? error : new Error(String(error)), {
        deploymentName: input.deploymentName || 'default',
        durationMs: duration.toString(),
        errorType: error.name || 'Unknown',
        operation: 'generateCompletion'
      });
      
      this.appInsights.trackMetric('AzureOpenAI:CompletionLatency', duration, {
        deploymentName: input.deploymentName || 'default',
        success: 'false',
        errorType: error.name || 'Unknown'
      });
      
      this.logger.error(`Error generating completion: ${error.message}`);
      throw new Error(`Failed to generate completion: ${error.message}`);
    }
  }

  /**
   * Search content using Azure Cognitive Search
   */
  async search(input: TextSearchInput): Promise<TextSearchOutput> {
    // Start performance timer and prepare telemetry
    const startTime = Date.now();
    const operationId = `search-${Date.now()}`;
    
    // Track the request
    this.appInsights.trackEvent('AzureSearch:Query:Start', {
      query: input.query,
      filters: input.filters ? input.filters : 'none'
    });
    
    try {
      // Initialize credentials from Key Vault if available
      await this.initializeCredentials();
      const { query, filters, top = 10, skip = 0, searchMode = 'all' } = input;
      
      const response = await axios.post(
        `${this.azureSearchEndpoint}/indexes/${this.azureSearchIndex}/docs/search?api-version=2023-10-01-Preview`,
        {
          search: query,
          filter: filters,
          top,
          skip,
          searchMode,
          queryType: 'semantic',
          semanticConfiguration: 'content-config',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureSearchKey,
          },
        }
      );

      // Calculate performance metrics
      const duration = Date.now() - startTime;
      
      // Track successful search
      this.appInsights.trackEvent('AzureSearch:Query:Success', {
        query: input.query,
        filters: input.filters ? input.filters : 'none',
        durationMs: duration.toString()
      });
      
      return {
        results: response.data.value.map(item => ({
          id: item.id,
          score: item['@search.score'],
          document: item,
        })),
        count: response.data['@odata.count'] || response.data.value.length,
      };
    } catch (error) {
      this.logger.error(`Error searching content: ${error.message}`);
      throw new Error(`Failed to search content: ${error.message}`);
    }
  }

  /**
   * Generate text embeddings using Azure OpenAI
   */
  async generateEmbeddings(input: TextEmbeddingInput): Promise<TextEmbeddingOutput> {
    // Start performance timer and prepare telemetry
    const startTime = Date.now();
    const operationId = `embedding-${Date.now()}`;
    
    // Track the request
    this.appInsights.trackEvent('AzureOpenAI:Embedding:Start', {
      deploymentName: input.deploymentName || 'text-embedding-ada-002',
      textCount: Array.isArray(input.text) ? input.text.length.toString() : '1'
    });
    
    try {
      // Initialize credentials from Key Vault if available
      await this.initializeCredentials();
      const { text, deploymentName = 'text-embedding-ada-002' } = input;
      
      // Ensure text is an array
      const textsArray = Array.isArray(text) ? text : [text];
      
      const response = await axios.post(
        `${this.azureOpenAiEndpoint}/openai/deployments/${deploymentName}/embeddings?api-version=2023-05-15`,
        {
          input: textsArray,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureOpenAiKey,
          },
        }
      );

      // Calculate performance metrics
      const duration = Date.now() - startTime;
      
      // Track successful embedding
      this.appInsights.trackEvent('AzureOpenAI:Embedding:Success', {
        deploymentName: input.deploymentName || 'text-embedding-ada-002',
        durationMs: duration.toString(),
        totalTokens: response.data.usage.total_tokens.toString()
      });
      
      this.appInsights.trackMetric('AzureOpenAI:EmbeddingLatency', duration, {
        deploymentName: input.deploymentName || 'text-embedding-ada-002',
        success: 'true'
      });
      
      return {
        embeddings: response.data.data.map(item => item.embedding),
        dimensions: response.data.data[0].embedding.length,
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
      };
    } catch (error) {
      this.logger.error(`Error generating embeddings: ${error.message}`);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  /**
   * Analyze text using Azure AI Language service
   */
  async analyzeText(input: TextAnalysisInput): Promise<TextAnalysisOutput> {
    // Start performance timer and prepare telemetry
    const startTime = Date.now();
    const operationId = `analysis-${Date.now()}`;
    
    // Track the request
    this.appInsights.trackEvent('AzureLanguage:Analysis:Start', {
      kind: input.kind,
      textLength: input.text.length.toString()
    });
    
    try {
      // Initialize credentials from Key Vault if available
      await this.initializeCredentials();
      const { text, kind = 'EntityRecognition', language = 'en' } = input;

      // Determine the endpoint based on the kind of analysis
      let endpoint = '';
      let requestBody = {};
      
      switch (kind) {
        case 'EntityRecognition':
          endpoint = `${process.env.AZURE_LANGUAGE_ENDPOINT}/language/analysis/v1.0/entities/recognition/general`;
          requestBody = {
            documents: [{ id: '1', text, language }]
          };
          break;
        case 'KeyPhraseExtraction':
          endpoint = `${process.env.AZURE_LANGUAGE_ENDPOINT}/language/analysis/v1.0/keyPhrases`;
          requestBody = {
            documents: [{ id: '1', text, language }]
          };
          break;
        case 'SentimentAnalysis':
          endpoint = `${process.env.AZURE_LANGUAGE_ENDPOINT}/language/analysis/v1.0/sentiment`;
          requestBody = {
            documents: [{ id: '1', text, language }]
          };
          break;
        default:
          throw new Error(`Unsupported analysis kind: ${kind}`);
      }

      const response = await axios.post(
        endpoint,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': process.env.AZURE_LANGUAGE_KEY,
          },
        }
      );

      // Process the response based on the kind
      let result: any;
      
      switch (kind) {
        case 'EntityRecognition':
          result = {
            entities: response.data.documents[0].entities,
          };
          break;
        case 'KeyPhraseExtraction':
          result = {
            keyPhrases: response.data.documents[0].keyPhrases,
          };
          break;
        case 'SentimentAnalysis':
          result = {
            sentiment: response.data.documents[0].sentiment,
            confidenceScores: response.data.documents[0].confidenceScores,
            sentences: response.data.documents[0].sentences,
          };
          break;
      }

      // Calculate performance metrics
      const duration = Date.now() - startTime;
      
      // Track successful text analysis
      this.appInsights.trackEvent('AzureLanguage:Analysis:Success', {
        kind: input.kind,
        durationMs: duration.toString(),
        success: 'true'
      });
      
      this.appInsights.trackMetric('AzureLanguage:AnalysisLatency', duration, {
        kind: input.kind,
        success: 'true'
      });
      
      return {
        kind,
        language,
        ...result,
      };
    } catch (error) {
      this.logger.error(`Error analyzing text: ${error.message}`);
      throw new Error(`Failed to analyze text: ${error.message}`);
    }
  }
}
