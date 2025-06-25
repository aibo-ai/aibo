const { CosmosClient } = require('@azure/cosmos');
const axios = require('axios');
const crypto = require('crypto');

class CosmosVectorStorageService {
  constructor() {
    this.cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT,
      key: process.env.COSMOS_DB_KEY
    });
    
    this.databaseName = process.env.COSMOS_DB_DATABASE_NAME || 'ContentArchitect';
    this.vectorsContainer = process.env.COSMOS_DB_VECTORS_CONTAINER || 'ContentVectors';
    this.embeddingsContainer = process.env.COSMOS_DB_EMBEDDINGS_CONTAINER || 'ContentEmbeddings';
    this.searchHistoryContainer = process.env.COSMOS_DB_SEARCH_HISTORY_CONTAINER || 'SearchHistory';
    
    // Azure OpenAI for embeddings
    this.azureOpenaiKey = process.env.AZURE_OPENAI_API_KEY;
    this.azureOpenaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    
    this.database = null;
    this.containers = {};
  }

  /**
   * Initialize database and containers
   */
  async initialize() {
    try {
      console.log('🔧 Initializing Cosmos DB vector storage...');
      
      // Create database if it doesn't exist
      const { database } = await this.cosmosClient.databases.createIfNotExists({
        id: this.databaseName
      });
      this.database = database;

      // Create containers
      await this.createContainers();
      
      console.log('✅ Cosmos DB vector storage initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Cosmos DB vector storage:', error);
      throw error;
    }
  }

  /**
   * Create required containers
   */
  async createContainers() {
    const containerConfigs = [
      {
        id: this.vectorsContainer,
        partitionKey: '/contentType',
        indexingPolicy: {
          indexingMode: 'consistent',
          automatic: true,
          includedPaths: [
            { path: '/*' }
          ],
          excludedPaths: [
            { path: '/embedding/*' }
          ]
        }
      },
      {
        id: this.embeddingsContainer,
        partitionKey: '/type',
        indexingPolicy: {
          indexingMode: 'consistent',
          automatic: true,
          includedPaths: [
            { path: '/*' }
          ],
          excludedPaths: [
            { path: '/vector/*' }
          ]
        }
      },
      {
        id: this.searchHistoryContainer,
        partitionKey: '/userId',
        indexingPolicy: {
          indexingMode: 'consistent',
          automatic: true,
          includedPaths: [
            { path: '/*' }
          ]
        }
      }
    ];

    for (const config of containerConfigs) {
      try {
        const { container } = await this.database.containers.createIfNotExists(config);
        this.containers[config.id] = container;
        console.log(`✅ Container ${config.id} ready`);
      } catch (error) {
        console.error(`❌ Failed to create container ${config.id}:`, error);
        throw error;
      }
    }
  }

  /**
   * Generate embeddings using Azure OpenAI
   */
  async generateEmbeddings(text, options = {}) {
    try {
      console.log('🧠 Generating embeddings...');
      
      const requestData = {
        input: text,
        model: options.model || 'text-embedding-ada-002'
      };

      const response = await axios.post(
        `${this.azureOpenaiEndpoint}openai/deployments/text-embedding-ada-002/embeddings?api-version=2024-04-19`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureOpenaiKey
          },
          timeout: 30000
        }
      );

      if (response.data && response.data.data && response.data.data[0]) {
        const embedding = response.data.data[0].embedding;
        console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
        
        return {
          embedding,
          model: requestData.model,
          usage: response.data.usage,
          dimensions: embedding.length,
          generatedAt: new Date().toISOString()
        };
      } else {
        throw new Error('Invalid response format from embeddings API');
      }
    } catch (error) {
      console.error('❌ Embedding generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Store content with vector embeddings
   */
  async storeContentWithVectors(contentData, metadata = {}) {
    try {
      if (!this.database) {
        await this.initialize();
      }

      console.log('💾 Storing content with vectors...');
      
      const contentId = contentData.contentId || this.generateContentId();
      const timestamp = new Date().toISOString();

      // Extract text for embedding
      const textForEmbedding = this.extractTextForEmbedding(contentData);
      
      // Generate embeddings
      const embeddingResult = await this.generateEmbeddings(textForEmbedding);

      // Store main content with vector
      const vectorDocument = {
        id: contentId,
        contentId: contentId,
        contentType: contentData.contentType || 'blog_post',
        title: contentData.title || contentData.data?.title || 'Untitled',
        content: contentData,
        embedding: embeddingResult.embedding,
        metadata: {
          ...metadata,
          createdAt: timestamp,
          textLength: textForEmbedding.length,
          embeddingModel: embeddingResult.model,
          embeddingDimensions: embeddingResult.dimensions,
          qualityScore: contentData.data?.metadata?.qualityScore || 0,
          eeatScore: contentData.data?.metadata?.eeatScore || 0,
          authorityRanking: contentData.data?.metadata?.authorityRanking || 'Unknown'
        },
        searchableText: textForEmbedding,
        tags: metadata.tags || [],
        status: 'active'
      };

      const { resource: storedVector } = await this.containers[this.vectorsContainer].items.create(vectorDocument);

      // Store embedding separately for efficient similarity search
      const embeddingDocument = {
        id: `embedding_${contentId}`,
        contentId: contentId,
        type: 'content_embedding',
        vector: embeddingResult.embedding,
        metadata: {
          contentType: vectorDocument.contentType,
          title: vectorDocument.title,
          createdAt: timestamp,
          dimensions: embeddingResult.dimensions,
          model: embeddingResult.model
        }
      };

      await this.containers[this.embeddingsContainer].items.create(embeddingDocument);

      console.log(`✅ Content stored with vectors: ${contentId}`);
      
      return {
        contentId,
        vectorId: storedVector.id,
        embeddingId: embeddingDocument.id,
        dimensions: embeddingResult.dimensions,
        storedAt: timestamp
      };
    } catch (error) {
      console.error('❌ Failed to store content with vectors:', error);
      throw error;
    }
  }

  /**
   * Search similar content using vector similarity
   */
  async searchSimilarContent(query, options = {}) {
    try {
      if (!this.database) {
        await this.initialize();
      }

      console.log('🔍 Searching similar content...');
      
      const limit = options.limit || 10;
      const threshold = options.threshold || 0.7;
      const contentType = options.contentType;

      // Generate embedding for query
      const queryEmbedding = await this.generateEmbeddings(query);

      // Build SQL query for vector similarity search
      let sqlQuery = `
        SELECT c.contentId, c.title, c.contentType, c.metadata, c.searchableText,
               VectorDistance(c.embedding, @queryVector) AS similarity
        FROM c 
        WHERE VectorDistance(c.embedding, @queryVector) > @threshold
      `;

      const parameters = [
        { name: '@queryVector', value: queryEmbedding.embedding },
        { name: '@threshold', value: threshold }
      ];

      if (contentType) {
        sqlQuery += ' AND c.contentType = @contentType';
        parameters.push({ name: '@contentType', value: contentType });
      }

      sqlQuery += ' ORDER BY VectorDistance(c.embedding, @queryVector) DESC';
      sqlQuery += ` OFFSET 0 LIMIT ${limit}`;

      const { resources } = await this.containers[this.vectorsContainer].items.query({
        query: sqlQuery,
        parameters
      }).fetchAll();

      // Store search history
      await this.storeSearchHistory(query, {
        resultsCount: resources.length,
        queryEmbedding: queryEmbedding.embedding,
        threshold,
        contentType,
        userId: options.userId
      });

      console.log(`✅ Found ${resources.length} similar content items`);
      
      return {
        query,
        results: resources,
        totalResults: resources.length,
        searchedAt: new Date().toISOString(),
        queryEmbedding: queryEmbedding
      };
    } catch (error) {
      console.error('❌ Vector search failed:', error);
      throw error;
    }
  }

  /**
   * Store search history
   */
  async storeSearchHistory(query, metadata = {}) {
    try {
      const searchRecord = {
        id: this.generateSearchId(),
        query,
        userId: metadata.userId || 'anonymous',
        timestamp: new Date().toISOString(),
        resultsCount: metadata.resultsCount || 0,
        searchType: 'vector_similarity',
        metadata: {
          threshold: metadata.threshold,
          contentType: metadata.contentType,
          embeddingModel: 'text-embedding-ada-002'
        }
      };

      await this.containers[this.searchHistoryContainer].items.create(searchRecord);
    } catch (error) {
      console.error('⚠️ Failed to store search history:', error.message);
      // Don't throw - search history is not critical
    }
  }

  /**
   * Get content by ID
   */
  async getContentById(contentId) {
    try {
      if (!this.database) {
        await this.initialize();
      }

      const { resource } = await this.containers[this.vectorsContainer].item(contentId, contentId).read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      console.error('❌ Failed to get content by ID:', error);
      throw error;
    }
  }

  /**
   * Update content vectors
   */
  async updateContentVectors(contentId, updatedContent, metadata = {}) {
    try {
      if (!this.database) {
        await this.initialize();
      }

      console.log(`🔄 Updating content vectors for ${contentId}...`);

      // Get existing content
      const existingContent = await this.getContentById(contentId);
      if (!existingContent) {
        throw new Error('Content not found');
      }

      // Generate new embeddings
      const textForEmbedding = this.extractTextForEmbedding(updatedContent);
      const embeddingResult = await this.generateEmbeddings(textForEmbedding);

      // Update vector document
      const updatedDocument = {
        ...existingContent,
        content: updatedContent,
        embedding: embeddingResult.embedding,
        searchableText: textForEmbedding,
        metadata: {
          ...existingContent.metadata,
          ...metadata,
          updatedAt: new Date().toISOString(),
          embeddingModel: embeddingResult.model,
          embeddingDimensions: embeddingResult.dimensions
        }
      };

      await this.containers[this.vectorsContainer].item(contentId, contentId).replace(updatedDocument);

      // Update embedding document
      const embeddingDocument = {
        id: `embedding_${contentId}`,
        contentId: contentId,
        type: 'content_embedding',
        vector: embeddingResult.embedding,
        metadata: {
          contentType: updatedDocument.contentType,
          title: updatedDocument.title,
          updatedAt: new Date().toISOString(),
          dimensions: embeddingResult.dimensions,
          model: embeddingResult.model
        }
      };

      await this.containers[this.embeddingsContainer].item(`embedding_${contentId}`, 'content_embedding').replace(embeddingDocument);

      console.log(`✅ Content vectors updated for ${contentId}`);
      
      return {
        contentId,
        updatedAt: new Date().toISOString(),
        dimensions: embeddingResult.dimensions
      };
    } catch (error) {
      console.error('❌ Failed to update content vectors:', error);
      throw error;
    }
  }

  /**
   * Delete content and its vectors
   */
  async deleteContent(contentId) {
    try {
      if (!this.database) {
        await this.initialize();
      }

      console.log(`🗑️ Deleting content and vectors for ${contentId}...`);

      // Delete main content
      await this.containers[this.vectorsContainer].item(contentId, contentId).delete();

      // Delete embedding
      await this.containers[this.embeddingsContainer].item(`embedding_${contentId}`, 'content_embedding').delete();

      console.log(`✅ Content and vectors deleted for ${contentId}`);
      
      return { contentId, deletedAt: new Date().toISOString() };
    } catch (error) {
      console.error('❌ Failed to delete content:', error);
      throw error;
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(options = {}) {
    try {
      if (!this.database) {
        await this.initialize();
      }

      const timeRange = options.timeRange || 7; // days
      const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString();

      const { resources } = await this.containers[this.searchHistoryContainer].items.query({
        query: `
          SELECT c.query, c.resultsCount, c.timestamp, c.metadata
          FROM c 
          WHERE c.timestamp >= @startDate
          ORDER BY c.timestamp DESC
        `,
        parameters: [{ name: '@startDate', value: startDate }]
      }).fetchAll();

      const analytics = {
        totalSearches: resources.length,
        averageResults: resources.reduce((sum, r) => sum + r.resultsCount, 0) / resources.length || 0,
        topQueries: this.getTopQueries(resources),
        searchTrends: this.getSearchTrends(resources),
        timeRange: timeRange,
        generatedAt: new Date().toISOString()
      };

      return analytics;
    } catch (error) {
      console.error('❌ Failed to get search analytics:', error);
      throw error;
    }
  }

  // Helper methods
  extractTextForEmbedding(contentData) {
    let text = '';
    
    if (typeof contentData === 'string') {
      return contentData;
    }
    
    if (contentData.data) {
      if (contentData.data.title) text += contentData.data.title + ' ';
      if (contentData.data.summary) text += contentData.data.summary + ' ';
      if (contentData.data.sections) {
        contentData.data.sections.forEach(section => {
          if (section.title) text += section.title + ' ';
          if (section.content) text += section.content + ' ';
        });
      }
    }
    
    if (contentData.content) {
      text += JSON.stringify(contentData.content) + ' ';
    }
    
    return text.trim().substring(0, 8000); // Limit for embedding API
  }

  generateContentId() {
    return `content_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  generateSearchId() {
    return `search_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }

  getTopQueries(searches) {
    const queryCount = {};
    searches.forEach(search => {
      queryCount[search.query] = (queryCount[search.query] || 0) + 1;
    });
    
    return Object.entries(queryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  }

  getSearchTrends(searches) {
    const dailySearches = {};
    searches.forEach(search => {
      const date = search.timestamp.split('T')[0];
      dailySearches[date] = (dailySearches[date] || 0) + 1;
    });
    
    return Object.entries(dailySearches)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }
}

module.exports = { CosmosVectorStorageService };
