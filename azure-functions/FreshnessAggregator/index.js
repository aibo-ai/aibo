const axios = require('axios');
const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_DB_ENDPOINT,
  key: process.env.COSMOS_DB_KEY
});

const database = cosmosClient.database(process.env.COSMOS_DB_DATABASE);
const container = database.container('freshContent');

module.exports = async function (context, myTimer) {
  const timeStamp = new Date().toISOString();
  context.log('Freshness Aggregator function triggered at:', timeStamp);

  try {
    // Get topic keywords from the database to search for
    const topics = await getTopicsToMonitor();
    
    // Collect content from various sources in parallel
    const results = await Promise.allSettled([
      fetchFromNewsAPI(topics),
      fetchFromSERPAPI(topics),
      fetchFromXAPI(topics),
      fetchFromMediastack(topics),
      fetchFromExaAPI(topics),
      fetchFromSocialSearcher(topics)
    ]);

    // Process results and filter out rejected promises
    const allContent = results
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value)
      .filter(Boolean); // Remove null/undefined items
    
    // Deduplicate content based on URL or unique identifier
    const uniqueContent = deduplicateContent(allContent);
    
    // Enrich content with additional metadata (sentiment, keywords, etc.)
    const enrichedContent = await enrichContent(uniqueContent);
    
    // Store the results in Cosmos DB
    const batchSize = 100;
    for (let i = 0; i < enrichedContent.length; i += batchSize) {
      const batch = enrichedContent.slice(i, i + batchSize);
      
      // Create batch operations for Cosmos DB
      const operations = batch.map(item => ({
        operationType: 'Create',
        resourceBody: {
          id: item.id || generateId(),
          source: item.source,
          title: item.title,
          content: item.content,
          url: item.url,
          publishedDate: item.publishedDate,
          topics: item.topics,
          sentiment: item.sentiment,
          entities: item.entities,
          createdAt: new Date().toISOString(),
          ttl: 604800 // 7 days TTL for content
        }
      }));
      
      // Execute batch operations
      await container.items.batch(operations);
    }

    context.log(`Successfully processed ${enrichedContent.length} items from various content sources`);
    
    // Output summary for the orchestrator
    context.bindings.outputDocument = {
      id: generateId(),
      type: 'freshnessAggregatorSummary',
      timestamp: timeStamp,
      totalItemsProcessed: enrichedContent.length,
      sourceBreakdown: getSourceBreakdown(enrichedContent),
      topicsFound: getTopicsFound(enrichedContent),
      executionTimeMs: new Date() - new Date(timeStamp)
    };
    
  } catch (error) {
    context.log.error(`Error in Freshness Aggregator: ${error.message}`);
    throw error; // Let Azure Functions handle the error
  }
};

async function getTopicsToMonitor() {
  // Query the database for active topics to monitor
  const querySpec = {
    query: "SELECT * FROM c WHERE c.type = 'monitoredTopic' AND c.isActive = true"
  };
  
  const { resources: topics } = await container.items.query(querySpec).fetchAll();
  return topics.map(topic => topic.keyword);
}

async function fetchFromNewsAPI(topics) {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    const apiUrl = process.env.NEWS_API_URL;
    
    // Create comma-separated list of topics
    const topicsString = topics.join(',');
    
    const response = await axios.get(apiUrl, {
      params: {
        q: topicsString,
        apiKey: apiKey,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 100
      }
    });
    
    if (response.data && response.data.articles) {
      return response.data.articles.map(article => ({
        id: `news-${article.url.split('/').pop()}`,
        source: 'NewsAPI',
        title: article.title,
        content: article.description,
        url: article.url,
        publishedDate: article.publishedAt,
        topics: findRelevantTopics(article, topics)
      }));
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching from NewsAPI: ${error.message}`);
    return [];
  }
}

async function fetchFromSERPAPI(topics) {
  // Similar implementation for SERP API
  return [];
}

async function fetchFromXAPI(topics) {
  // Similar implementation for X API
  return [];
}

async function fetchFromMediastack(topics) {
  // Similar implementation for Mediastack API
  return [];
}

async function fetchFromExaAPI(topics) {
  // Similar implementation for Exa API
  return [];
}

async function fetchFromSocialSearcher(topics) {
  // Similar implementation for Social Searcher API
  return [];
}

function deduplicateContent(contentItems) {
  const uniqueUrls = new Set();
  return contentItems.filter(item => {
    if (uniqueUrls.has(item.url)) {
      return false;
    }
    uniqueUrls.add(item.url);
    return true;
  });
}

async function enrichContent(contentItems) {
  // This would call Azure Cognitive Services to add sentiment, key phrases, entities, etc.
  // Simplified implementation for now
  return contentItems;
}

function findRelevantTopics(article, topics) {
  // Find which topics are mentioned in the article
  const content = (article.title + ' ' + article.description).toLowerCase();
  return topics.filter(topic => content.includes(topic.toLowerCase()));
}

function getSourceBreakdown(contentItems) {
  const breakdown = {};
  contentItems.forEach(item => {
    breakdown[item.source] = (breakdown[item.source] || 0) + 1;
  });
  return breakdown;
}

function getTopicsFound(contentItems) {
  const topicsCount = {};
  contentItems.forEach(item => {
    if (item.topics && Array.isArray(item.topics)) {
      item.topics.forEach(topic => {
        topicsCount[topic] = (topicsCount[topic] || 0) + 1;
      });
    }
  });
  return topicsCount;
}

function generateId() {
  return `fa-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
