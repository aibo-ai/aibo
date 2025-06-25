const crypto = require('crypto');

class CosmosVectorStorageFallback {
  constructor() {
    this.storage = new Map();
    this.embeddings = new Map();
    this.searchHistory = new Map();
    this.database = { initialized: true }; // Mock database property
    
    console.log('⚠️ Using Cosmos DB fallback storage (in-memory)');
  }

  /**
   * Initialize database and containers (mock)
   */
  async initialize() {
    console.log('🔧 Initializing fallback vector storage...');
    this.database = { initialized: true };
    console.log('✅ Fallback vector storage initialized');
  }

  /**
   * Generate embeddings using mock data
   */
  async generateEmbeddings(text, options = {}) {
    try {
      console.log('🧠 Generating mock embeddings...');
      
      // Generate deterministic mock embedding based on text
      const hash = crypto.createHash('sha256').update(text).digest('hex');
      const embedding = [];
      
      // Create 1536-dimensional embedding (OpenAI standard)
      for (let i = 0; i < 1536; i++) {
        const seed = parseInt(hash.substr(i % hash.length, 8), 16);
        embedding.push((seed % 2000 - 1000) / 1000); // Values between -1 and 1
      }
      
      console.log(`✅ Generated mock embedding with ${embedding.length} dimensions`);
      
      return {
        embedding,
        model: options.model || 'text-embedding-ada-002-mock',
        usage: { prompt_tokens: text.length / 4, total_tokens: text.length / 4 },
        dimensions: embedding.length,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Mock embedding generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Store content with vector embeddings
   */
  async storeContentWithVectors(contentData, metadata = {}) {
    try {
      console.log('💾 Storing content with vectors (fallback)...');
      
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

      this.storage.set(contentId, vectorDocument);

      // Store embedding separately
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

      this.embeddings.set(`embedding_${contentId}`, embeddingDocument);

      console.log(`✅ Content stored with vectors (fallback): ${contentId}`);
      
      return {
        contentId,
        vectorId: contentId,
        embeddingId: embeddingDocument.id,
        dimensions: embeddingResult.dimensions,
        storedAt: timestamp,
        stored: true
      };
    } catch (error) {
      console.error('❌ Failed to store content with vectors (fallback):', error);
      throw error;
    }
  }

  /**
   * Search similar content using vector similarity
   */
  async searchSimilarContent(query, options = {}) {
    try {
      console.log('🔍 Searching similar content (fallback)...');
      
      const limit = options.limit || 10;
      const threshold = options.threshold || 0.7;

      // Generate embedding for query
      const queryEmbedding = await this.generateEmbeddings(query);

      // Search through stored content
      const results = [];
      for (const [contentId, document] of this.storage) {
        if (options.contentType && document.contentType !== options.contentType) {
          continue;
        }

        // Calculate cosine similarity
        const similarity = this.calculateCosineSimilarity(
          queryEmbedding.embedding,
          document.embedding
        );

        if (similarity > threshold) {
          results.push({
            contentId: document.contentId,
            title: document.title,
            contentType: document.contentType,
            metadata: document.metadata,
            searchableText: document.searchableText.substring(0, 200) + '...',
            similarity: similarity
          });
        }
      }

      // Sort by similarity and limit results
      results.sort((a, b) => b.similarity - a.similarity);
      const limitedResults = results.slice(0, limit);

      // Store search history
      await this.storeSearchHistory(query, {
        resultsCount: limitedResults.length,
        threshold,
        contentType: options.contentType,
        userId: options.userId
      });

      console.log(`✅ Found ${limitedResults.length} similar content items (fallback)`);
      
      return {
        query,
        results: limitedResults,
        totalResults: limitedResults.length,
        searchedAt: new Date().toISOString(),
        queryEmbedding: queryEmbedding
      };
    } catch (error) {
      console.error('❌ Vector search failed (fallback):', error);
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
        searchType: 'vector_similarity_fallback',
        metadata: {
          threshold: metadata.threshold,
          contentType: metadata.contentType,
          embeddingModel: 'text-embedding-ada-002-mock'
        }
      };

      this.searchHistory.set(searchRecord.id, searchRecord);
    } catch (error) {
      console.error('⚠️ Failed to store search history (fallback):', error.message);
    }
  }

  /**
   * Get content by ID
   */
  async getContentById(contentId) {
    return this.storage.get(contentId) || null;
  }

  /**
   * Update content vectors
   */
  async updateContentVectors(contentId, updatedContent, metadata = {}) {
    try {
      console.log(`🔄 Updating content vectors for ${contentId} (fallback)...`);

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

      this.storage.set(contentId, updatedDocument);

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

      this.embeddings.set(`embedding_${contentId}`, embeddingDocument);

      console.log(`✅ Content vectors updated for ${contentId} (fallback)`);
      
      return {
        contentId,
        updatedAt: new Date().toISOString(),
        dimensions: embeddingResult.dimensions
      };
    } catch (error) {
      console.error('❌ Failed to update content vectors (fallback):', error);
      throw error;
    }
  }

  /**
   * Delete content and its vectors
   */
  async deleteContent(contentId) {
    try {
      console.log(`🗑️ Deleting content and vectors for ${contentId} (fallback)...`);

      this.storage.delete(contentId);
      this.embeddings.delete(`embedding_${contentId}`);

      console.log(`✅ Content and vectors deleted for ${contentId} (fallback)`);
      
      return { contentId, deletedAt: new Date().toISOString() };
    } catch (error) {
      console.error('❌ Failed to delete content (fallback):', error);
      throw error;
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(options = {}) {
    try {
      const searches = Array.from(this.searchHistory.values());
      const timeRange = options.timeRange || 7;
      const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);

      const recentSearches = searches.filter(s => new Date(s.timestamp) >= startDate);

      const analytics = {
        totalSearches: recentSearches.length,
        averageResults: recentSearches.reduce((sum, r) => sum + r.resultsCount, 0) / recentSearches.length || 0,
        topQueries: this.getTopQueries(recentSearches),
        searchTrends: this.getSearchTrends(recentSearches),
        timeRange: timeRange,
        generatedAt: new Date().toISOString(),
        storageType: 'fallback'
      };

      return analytics;
    } catch (error) {
      console.error('❌ Failed to get search analytics (fallback):', error);
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
    
    return text.trim().substring(0, 8000);
  }

  generateContentId() {
    return `content_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  generateSearchId() {
    return `search_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }

  calculateCosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
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

module.exports = { CosmosVectorStorageFallback };
