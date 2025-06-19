import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { SearchClient, AzureKeyCredential as SearchKeyCredential } from '@azure/search-documents';

@Injectable()
export class AzureAIService {
  private readonly logger = new Logger(AzureAIService.name);
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly openaiClient: OpenAIClient;
  private readonly searchClient: SearchClient<any>;
  private readonly aiFoundryEndpoint: string;
  private readonly aiFoundryKey: string;
  private readonly aiFoundryDeploymentUrl: string;
  private readonly aiFoundryDeploymentName: string;
  private readonly aiFoundryApiVersion: string;

  constructor(private configService: ConfigService) {
    // Initialize Azure AI Foundry configuration
    this.aiFoundryEndpoint = this.configService.get<string>('AZURE_AI_FOUNDRY_ENDPOINT');
    this.aiFoundryKey = this.configService.get<string>('AZURE_AI_FOUNDRY_KEY');
    this.aiFoundryDeploymentUrl = this.configService.get<string>('AZURE_AU_FOUNDRY_DEPLOYMENT_URL');
    this.aiFoundryDeploymentName = this.configService.get<string>('AZURE_AI_FOUNDRY_DEPLOYMENT_NAME');
    this.aiFoundryApiVersion = this.configService.get<string>('AZURE_AI_FOUNDRY_API_VERSION');
    
    // For backward compatibility
    this.endpoint = this.aiFoundryEndpoint;
    this.apiKey = this.aiFoundryKey;
    
    this.logger.log('Initializing Azure AI Service with AI Foundry configuration');
    
    try {
      // Initialize OpenAI client
      this.openaiClient = new OpenAIClient(
        this.aiFoundryEndpoint,
        new AzureKeyCredential(this.aiFoundryKey)
      );
      this.logger.log('OpenAI client initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize OpenAI client: ${error.message}`);
    }
    
    try {
      // Initialize Azure Cognitive Search client
      const searchEndpoint = this.configService.get<string>('AZURE_SEARCH_ENDPOINT');
      const searchApiKey = this.configService.get<string>('AZURE_SEARCH_KEY');
      const indexName = this.configService.get<string>('AZURE_SEARCH_INDEX_NAME') || 'content-index';
      
      if (searchEndpoint && searchApiKey) {
        this.searchClient = new SearchClient<any>(
          searchEndpoint,
          indexName,
          new SearchKeyCredential(searchApiKey)
        );
        this.logger.log('Azure Search client initialized successfully');
      } else {
        this.logger.warn('Azure Search client not initialized: missing endpoint or key');
      }
    } catch (error) {
      this.logger.error(`Failed to initialize Azure Search client: ${error.message}`);
    }
  }

  /**
   * Generate AI completions using Azure AI Foundry
   * @param prompt The prompt to send to the AI model
   * @param options Additional options for the AI model
   */
  async generateCompletion(prompt: string, options: any = {}): Promise<any> {
    try {
      // Use AI Foundry deployment name if available, otherwise use the provided one or default
      const deploymentName = options.deploymentName || this.aiFoundryDeploymentName || 'gpt-4o';
      this.logger.log(`Generating completion using deployment: ${deploymentName}`);
      
      try {
        // First try using the OpenAI client
        const result = await this.openaiClient.getChatCompletions(
          deploymentName,
          [
            { role: "system", content: options.systemMessage || "You are an AI assistant helping with content creation." },
            { role: "user", content: prompt }
          ],
          {
            temperature: options.temperature || 0.7,
            maxTokens: options.maxTokens || 1000,
            topP: options.topP || 1,
            frequencyPenalty: options.frequencyPenalty,
            presencePenalty: options.presencePenalty,
            stop: options.stop
          }
        );

        return {
          id: result.id,
          created: new Date().getTime(),
          choices: [
            {
              text: result.choices[0].message.content,
              finish_reason: result.choices[0].finishReason
            }
          ],
          usage: result.usage
        };
      } catch (clientError) {
        this.logger.warn(`OpenAI client failed: ${clientError.message}. Falling back to direct API call.`);
        
        // Fallback to direct API call using axios
        const apiUrl = this.aiFoundryDeploymentUrl || 
          `${this.aiFoundryEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${this.aiFoundryApiVersion || '2025-01-01-preview'}`;
        
        this.logger.log(`Using API URL: ${apiUrl}`);
        
        const response = await axios.post(
          apiUrl,
          {
            messages: [
              { role: "system", content: options.systemMessage || "You are an AI assistant helping with content creation." },
              { role: "user", content: prompt }
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 1000,
            top_p: options.topP || 1,
            frequency_penalty: options.frequencyPenalty,
            presence_penalty: options.presencePenalty,
            stop: options.stop
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'api-key': this.aiFoundryKey
            }
          }
        );
        
        return {
          id: response.data.id,
          created: new Date().getTime(),
          choices: [
            {
              text: response.data.choices[0].message.content,
              finish_reason: response.data.choices[0].finish_reason
            }
          ],
          usage: response.data.usage
        };
      }
    } catch (error) {
      this.logger.error(`Error generating completion from Azure AI Foundry: ${error.message}`);
      throw new Error(`Failed to generate completion: ${error.message}`);
    }
  }
  
  /**
   * Get AI completion text directly (simpler interface)
   * @param prompt The prompt to send to the AI model
   * @param options Additional options for the AI model
   * @returns The text response from the AI model
   */
  async getCompletion(prompt: string | any, options: any = {}): Promise<string> {
    try {
      // Handle case where prompt is already a completion result
      if (typeof prompt === 'object' && prompt.choices && prompt.choices[0] && prompt.choices[0].text) {
        return prompt.choices[0].text;
      }
      
      // Otherwise generate a new completion
      const result = await this.generateCompletion(prompt as string, options);
      return result.choices[0].text || '';
    } catch (error) {
      this.logger.error(`Error in getCompletion: ${error.message}`);
      throw new Error(`Failed to get completion: ${error.message}`);
    }
  }

  /**
   * Generate AI embeddings using Azure OpenAI
   * @param text The text to generate embeddings for
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const deploymentName = 'text-embedding-ada-002';
      
      const result = await this.openaiClient.getEmbeddings(deploymentName, [text]);
      
      return result.data[0].embedding;
    } catch (error) {
      console.error('Error generating embeddings from Azure OpenAI:', error.message);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }
  
  /**
   * Analyze text using Azure Cognitive Services
   * @param text The text to analyze
   * @param features The features to analyze (e.g., entities, sentiment, keyphrases)
   */
  async analyzeText(text: string, features: string[] = ['entities', 'sentiment', 'keyphrases']): Promise<any> {
    try {
      const cogServicesEndpoint = this.configService.get<string>('AZURE_COG_SERVICES_ENDPOINT');
      const cogServicesKey = this.configService.get<string>('AZURE_COG_SERVICES_KEY');

      const response = await axios.post(
        `${cogServicesEndpoint}text/analytics/v3.1/analyze`,
        {
          documents: [
            {
              id: '1',
              language: 'en',
              text,
            },
          ],
          kind: features,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': cogServicesKey,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error analyzing text with Azure Cognitive Services:', error.message);
      throw new Error(`Failed to analyze text: ${error.message}`);
    }
  }

  /**
   * Search using Azure Cognitive Search
   * @param query The search query
   * @param indexName The name of the search index
   */
  async search(query: string, indexName: string = 'content-index'): Promise<any> {
    try {
      // Using the SDK client approach
      const searchResults = await this.searchClient.search(query, {
        queryType: 'simple' as any,
        searchFields: ['content', 'title', 'description'],
        select: ['title', 'content', 'description', 'url', 'lastUpdated']
      });
      
      const results = [];
      for await (const result of searchResults.results) {
        results.push(result.document);
      }
      
      return results;
    } catch (error) {
      console.error('Error searching with Azure Cognitive Search via SDK:', error.message);
      
      // Fallback to REST API if SDK fails
      try {
        const searchEndpoint = this.configService.get<string>('AZURE_SEARCH_ENDPOINT');
        const searchKey = this.configService.get<string>('AZURE_SEARCH_KEY');

        const response = await axios.post(
          `${searchEndpoint}/indexes/${indexName}/docs/search`,
          {
            search: query,
            queryType: 'semantic',
            searchFields: ['content', 'title', 'description'],
            select: 'title,content,description,url,lastUpdated',
            top: 10,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'api-key': searchKey,
            },
          },
        );

        return response.data.value;
      } catch (fallbackError) {
        console.error('Error searching with Azure Cognitive Search via REST API:', fallbackError.message);
        throw new Error(`Failed to search: ${fallbackError.message}`);
      }
    }
  }
}
