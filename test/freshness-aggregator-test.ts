import * as dotenv from 'dotenv';
import { FreshnessAggregatorService } from '../src/components/bottom-layer/freshness-aggregator/services/freshness-aggregator.service';
import { ContentType, FreshnessSearchParameters, FreshnessAggregatorResponse } from '../src/components/bottom-layer/freshness-aggregator/models/content-models';
import { SerpApiClient } from '../src/components/bottom-layer/freshness-aggregator/clients/serp-api-client';
import { TwitterApiClient } from '../src/components/bottom-layer/freshness-aggregator/clients/twitter-api-client';
import { NewsApiClient } from '../src/components/bottom-layer/freshness-aggregator/clients/news-api-client';
import { MediastackApiClient } from '../src/components/bottom-layer/freshness-aggregator/clients/mediastack-api-client';
import { SocialSearcherClient } from '../src/components/bottom-layer/freshness-aggregator/clients/social-searcher-client';
import { ExaApiClient } from '../src/components/bottom-layer/freshness-aggregator/clients/exa-api-client';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Load environment variables
dotenv.config();

// Test configuration
const TEST_QUERY = 'artificial intelligence';
const TEST_OPTIONS: FreshnessSearchParameters = {
  query: TEST_QUERY,
  limit: 5, // Keep it small for testing
  contentTypes: [
    ContentType.NEWS, 
    ContentType.SOCIAL,
    ContentType.SERP,
    ContentType.BLOG
  ],
  sortBy: 'freshness',
  language: 'en',
  region: 'us',
  skipCache: true,
  qdfEnabled: true
};

// Mock ConfigService for testing
const mockConfigService = {
  get: (key: string) => process.env[key]
} as any;

// Initialize API clients with mock ConfigService
const clients = {
  serp: new SerpApiClient(mockConfigService),
  twitter: new TwitterApiClient(
    mockConfigService.get('X_API_KEY'),
    mockConfigService.get('X_API_SECRET'),
    mockConfigService.get('X_BEARER_TOKEN')
  ),
  news: new NewsApiClient(mockConfigService),
  mediastack: new MediastackApiClient(mockConfigService),
  socialSearcher: new SocialSearcherClient(mockConfigService),
  exa: new ExaApiClient(mockConfigService)
};

// Initialize the Freshness Aggregator service
const freshnessService = new FreshnessAggregatorService(mockConfigService);

// Manually set the API clients for testing
Object.assign(freshnessService, clients);

// Test individual API clients
async function testApiClients() {
  console.log('\n=== Testing Individual API Clients ===');
  
  // Test SERP API
  try {
    console.log('\n1. Testing SERP API...');
    const serpResults = await clients.serp.search(TEST_QUERY, { limit: 2 });
    console.log(`✅ SERP API: Found ${serpResults.length} results`);
    console.log('   First result:', {
      title: serpResults[0]?.title?.substring(0, 50) + '...',
      url: serpResults[0]?.url
    });
  } catch (error) {
    console.error('❌ SERP API Error:', error.message);
  }

  // Test News API
  try {
    console.log('\n2. Testing News API...');
    const newsResults = await clients.news.searchNews(TEST_QUERY, { pageSize: 2 });
    console.log(`✅ News API: Found ${newsResults.length} articles`);
    console.log('   First article:', {
      title: newsResults[0]?.title?.substring(0, 50) + '...',
      source: newsResults[0]?.source
    });
  } catch (error) {
    console.error('❌ News API Error:', error.message);
  }

  // Test Social Searcher API
  try {
    console.log('\n3. Testing Social Searcher API...');
    const socialResults = await clients.socialSearcher.searchSocial(TEST_QUERY, {
      networks: ['twitter'],
      limit: 2
    });
    console.log(`✅ Social Searcher: Found ${socialResults.length} posts`);
    if (socialResults.length > 0) {
      console.log('   First post:', {
        text: socialResults[0]?.title?.substring(0, 50) + '...',
        platform: socialResults[0]?.platform
      });
    }
  } catch (error) {
    console.error('❌ Social Searcher Error:', error.message);
  }

  // Test Exa API
  try {
    console.log('\n4. Testing Exa API...');
    const exaResults = await clients.exa.searchRecent(TEST_QUERY, { numResults: 2 });
    console.log(`✅ Exa API: Found ${exaResults.length} results`);
    console.log('   First result:', {
      title: exaResults[0]?.title?.substring(0, 50) + '...',
      url: exaResults[0]?.url
    });
  } catch (error) {
    console.error('❌ Exa API Error:', error.message);
  }
}

// Test the full Freshness Aggregator service
async function testFreshnessAggregator() {
  console.log('\n=== Testing Freshness Aggregator Service ===');
  
  try {
    console.log('\nFetching fresh content...');
    const response = await freshnessService.aggregateFreshContent(TEST_OPTIONS);
    
    console.log('\n=== Aggregation Results ===');
    console.log(`Query: ${response.query}`);
    console.log(`QDF Score: ${response.qdfScore?.toFixed(2) || 'N/A'}`);
    console.log(`Total items found: ${response.items?.length || 0}`);
    
    if (!response.items || response.items.length === 0) {
      console.log('No items found');
      return;
    }
    
    // Group by content type
    const byType = response.items.reduce((acc, item) => {
      const type = item.originalItem?.contentType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nContent by type:');
    console.table(byType);
    
    // Show sample items
    console.log('\nSample items:');
    response.items.slice(0, 3).forEach((item, i) => {
      const original = item.originalItem;
      if (!original) return;
      
      console.log(`\n[${i + 1}] ${original.contentType?.toUpperCase() || 'UNKNOWN'}: ${original.title?.substring(0, 60) || 'No title'}...`);
      console.log(`   Freshness: ${item.freshness?.score?.toFixed(2) || 'N/A'} (${item.freshness?.recency || 'N/A'})`);
      console.log(`   Source: ${original.source || 'N/A'} | Published: ${original.publishedAt?.toISOString().split('T')[0] || 'N/A'}`);
      console.log(`   URL: ${original.url || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error in Freshness Aggregator:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    } else if (error.message) {
      console.error('Error message:', error.message);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Freshness Aggregator Test Suite 🚀');
  
  // Test individual API clients
  await testApiClients();
  
  // Test the full service
  await testFreshnessAggregator();
  
  console.log('\n✨ Test suite completed! ✨');
}

// Execute the tests
runAllTests().catch(console.error);
