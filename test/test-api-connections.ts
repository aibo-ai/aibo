import { config } from 'dotenv';
import { SerpApiClient } from '../src/components/bottom-layer/freshness-aggregator/clients/serp-api-client';
import { TwitterApiClient } from '../src/components/bottom-layer/freshness-aggregator/clients/twitter-api-client';
import { NewsApiClient } from '../src/components/bottom-layer/freshness-aggregator/clients/news-api-client';
import { MediastackApiClient } from '../src/components/bottom-layer/freshness-aggregator/clients/mediastack-api-client';
import { SocialSearcherClient } from '../src/components/bottom-layer/freshness-aggregator/clients/social-searcher-client';
import { ExaApiClient } from '../src/components/bottom-layer/freshness-aggregator/clients/exa-api-client';
import axios from 'axios';
import * as https from 'https';

// Allow self-signed certificates for testing
const httpsAgent = new https.Agent({  
  rejectUnauthorized: false
});

const TEST_QUERY = 'artificial intelligence';

async function testApiConnections() {
  // Load environment variables
  config();
  
  const results: Record<string, { status: string; message: string; data?: any }> = {};

  console.log('Starting API connection tests...\n');

  // Test 1: SERP API
  try {
    console.log('Testing SERP API...');
    const apiKey = process.env.SERP_API_KEY;
    console.log('SERP API Key (first 5 chars):', apiKey ? `${apiKey.substring(0, 5)}...` : 'undefined');
    
    if (!apiKey) {
      throw new Error('SERP_API_KEY environment variable is not set');
    }
    
    const serpClient = new SerpApiClient(apiKey);
    console.log('SerpApiClient created, testing search...');
    
    const serpResults = await serpClient.search(TEST_QUERY, {
      region: 'us',
      language: 'en'
    });
    
    results.serp = {
      status: '✅ Connected',
      message: `Found ${serpResults?.length || 0} results`,
      data: serpResults?.[0] ? { title: serpResults[0].title, url: serpResults[0].url } : undefined
    };
  } catch (error) {
    console.error('SERP API Test Error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data || 'No response data',
      config: {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        headers: error.config?.headers
      }
    });
    
    results.serp = { 
      status: '❌ Failed', 
      message: error.message,
      data: error.response?.data || error.stack
    };
  }

  // Test 2: Twitter API
  console.log('\nTesting X (Twitter) API...');
  try {
    const apiKey = process.env.X_API_KEY;
    const apiSecret = process.env.X_API_SECRET;
    const bearerToken = process.env.X_BEARER_TOKEN;
    
    if (!apiKey || !apiSecret || !bearerToken) {
      throw new Error('X API credentials are required');
    }
    
    const twitterClient = new TwitterApiClient(apiKey, apiSecret, bearerToken);
    const twitterResults = await twitterClient.searchTweets(TEST_QUERY, { maxResults: 2 });
    results.twitter = {
      status: '✅ Connected',
      message: `Found ${twitterResults?.length || 0} tweets`,
      data: twitterResults?.slice(0, 2)
    };
  } catch (error) {
    results.twitter = {
      status: '❌ Failed',
      message: error.message,
      data: error.stack
    };
  }

  // Test 3: News API
  try {
    console.log('\n🔍 Testing News API...');
    const mockConfigService = {
      get: (key: string) => process.env[key]
    } as any;
    
    const newsClient = new NewsApiClient(mockConfigService);
    const newsResults = await newsClient.searchNews(TEST_QUERY, { pageSize: 2 });
    results.news = {
      status: '✅ Connected',
      message: `Found ${newsResults?.length || 0} articles`,
      data: newsResults?.[0] ? { title: newsResults[0].title, source: newsResults[0].source } : undefined
    };
  } catch (error) {
    results.news = { 
      status: '❌ Failed', 
      message: error.message,
      data: error.response?.data || error.stack
    };
  }

  // Test 4: Mediastack API
  try {
    console.log('Testing Mediastack API...');
    const mediastackClient = new MediastackApiClient(process.env.MEDIASTACK_API_KEY);
    const mediastackResults = await mediastackClient.searchNews(TEST_QUERY, { limit: 2 });
    results.mediastack = {
      status: '✅ Connected',
      message: `Found ${mediastackResults?.length || 0} articles`,
      data: mediastackResults?.[0] ? { title: mediastackResults[0].title, source: mediastackResults[0].source } : undefined
    };
  } catch (error) {
    results.mediastack = { 
      status: '❌ Failed', 
      message: error.message,
      data: error.response?.data || error.stack
    };
  }

  // Test 5: Social Searcher API
  try {
    console.log('Testing Social Searcher API...');
    
    if (!process.env.SOCIAL_SEARCHER_API_KEY) {
      throw new Error('SOCIAL_SEARCHER_API_KEY is not set in environment variables');
    }
    
    const socialSearcherClient = new SocialSearcherClient(process.env.SOCIAL_SEARCHER_API_KEY);
    
    // Test with absolute minimum parameters - just the query
    console.log('Testing Social Searcher API with minimal parameters');
    const socialResults = await socialSearcherClient.searchSocial(TEST_QUERY, {
      // No additional parameters
    });
    
    results.socialSearcher = {
      status: '✅ Connected',
      message: `Found ${socialResults?.length || 0} posts`,
      data: socialResults?.[0] ? { 
        title: socialResults[0].title || 'No title',
        url: socialResults[0].url || 'No URL',
        source: socialResults[0].source || 'Social Searcher',
        platform: socialResults[0].platform,
        publishedAt: socialResults[0].publishedAt?.toISOString() || new Date().toISOString(),
        engagement: socialResults[0].engagement?.totalEngagement || 0
      } : undefined
    };
    
  } catch (error: any) {
    console.error('Social Searcher API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        params: error.config?.params,
        headers: Object.keys(error.config?.headers || {}).filter((k: string) => k !== 'authorization')
      }
    });
    
    results.socialSearcher = { 
      status: '❌ Failed', 
      message: `SocialSearcherClient error in searchSocial: ${error.message}`,
      data: error.response?.data || error.message
    };
  }

  // Test 6: Exa API
  try {
    console.log('\n🔍 Testing Exa API...');
    const mockConfigService = {
      get: (key: string) => process.env[key]
    } as any;
    
    const exaClient = new ExaApiClient(mockConfigService);
    const exaResults = await exaClient.searchRecent(TEST_QUERY, { numResults: 2 });
    results.exa = {
      status: '✅ Connected',
      message: `Found ${exaResults?.length || 0} results`,
      data: exaResults?.[0] ? { title: exaResults[0].title, url: exaResults[0].url } : undefined
    };
  } catch (error) {
    results.exa = { 
      status: '❌ Failed', 
      message: error.message,
      data: error.response?.data || error.stack
    };
  }

  // Print results in a clean table
  console.log('\nAPI Connection Test Results:');
  console.table(Object.entries(results).map(([api, result]) => ({
    API: api,
    Status: result.status,
    Message: result.message
  })));

  // Print detailed error information if any failed
  const failedApis = Object.entries(results).filter(([_, result]) => result.status === '❌ Failed');
  if (failedApis.length > 0) {
    console.log('\nDetailed error information:');
    failedApis.forEach(([api, result]) => {
      console.log(`\n${api}:`);
      console.log(`Message: ${result.message}`);
      console.log('Error details:', JSON.stringify(result.data, null, 2));
    });
  }
}

testApiConnections().catch(console.error);
