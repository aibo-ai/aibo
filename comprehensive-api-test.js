#!/usr/bin/env node

/**
 * Comprehensive API and Services Test Script
 * Tests all Azure services, external APIs, and core components
 */

require('dotenv').config();
const axios = require('axios');

class ComprehensiveApiTester {
  constructor() {
    this.testResults = {};
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive API Testing...\n');
    console.log('=' .repeat(80));

    // Test Categories
    await this.testAzureServices();
    await this.testExternalAPIs();
    await this.testCoreServices();
    
    this.printSummary();
  }

  async testAzureServices() {
    console.log('\n🏛️  TESTING AZURE SERVICES');
    console.log('-'.repeat(50));

    await this.testAzureOpenAI();
    await this.testAzureCosmosDB();
    await this.testAzureCognitiveSearch();
    await this.testAzureLanguageServices();
    await this.testAzureRedisCache();
  }

  async testExternalAPIs() {
    console.log('\n🌐 TESTING EXTERNAL APIs');
    console.log('-'.repeat(50));

    await this.testNewsAPI();
    await this.testSerperAPI();
    await this.testExaAPI();
    await this.testSocialSearcherAPI();
    await this.testMediastackAPI();
  }

  async testCoreServices() {
    console.log('\n⚙️  TESTING CORE SERVICES');
    console.log('-'.repeat(50));

    await this.testQueryIntentAnalyzer();
    await this.testFreshnessAggregator();
    await this.testContentOptimizer();
  }

  async testAzureOpenAI() {
    try {
      console.log('Testing Azure OpenAI...');
      
      const response = await axios.post(
        `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION}`,
        {
          messages: [
            { role: 'user', content: 'Say "Azure OpenAI is working" in exactly those words.' }
          ],
          max_tokens: 50
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': process.env.AZURE_OPENAI_API_KEY
          },
          timeout: 10000
        }
      );

      if (response.status === 200 && response.data.choices) {
        this.recordTest('Azure OpenAI', true, 'Connection successful');
      } else {
        this.recordTest('Azure OpenAI', false, 'Unexpected response format');
      }
    } catch (error) {
      this.recordTest('Azure OpenAI', false, error.message);
    }
  }

  async testAzureCosmosDB() {
    try {
      console.log('Testing Azure Cosmos DB...');
      
      const { CosmosClient } = require('@azure/cosmos');
      const client = new CosmosClient({
        endpoint: process.env.COSMOS_DB_ENDPOINT,
        key: process.env.COSMOS_DB_KEY
      });

      const database = client.database(process.env.COSMOS_DB_DATABASE_NAME);
      const { resource } = await database.read();
      
      if (resource) {
        this.recordTest('Azure Cosmos DB', true, `Database "${resource.id}" accessible`);
      } else {
        this.recordTest('Azure Cosmos DB', false, 'Database not found');
      }
    } catch (error) {
      this.recordTest('Azure Cosmos DB', false, error.message);
    }
  }

  async testAzureCognitiveSearch() {
    try {
      console.log('Testing Azure Cognitive Search...');
      
      const searchEndpoint = process.env.AZURE_SEARCH_SERVICE_ENDPOINT;
      const response = await axios.get(
        `${searchEndpoint}indexes?api-version=${process.env.AZURE_SEARCH_API_VERSION}`,
        {
          headers: {
            'api-key': process.env.AZURE_SEARCH_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.status === 200) {
        this.recordTest('Azure Cognitive Search', true, `Found ${response.data.value?.length || 0} indexes`);
      } else {
        this.recordTest('Azure Cognitive Search', false, 'Service not accessible');
      }
    } catch (error) {
      this.recordTest('Azure Cognitive Search', false, error.message);
    }
  }

  async testAzureLanguageServices() {
    try {
      console.log('Testing Azure Language Services...');
      
      const response = await axios.post(
        `${process.env.AZURE_LANGUAGE_SERVICE_ENDPOINT}language/:analyze-text?api-version=${process.env.AZURE_LANGUAGE_SERVICE_API_VERSION}`,
        {
          kind: 'SentimentAnalysis',
          parameters: {
            modelVersion: 'latest'
          },
          analysisInput: {
            documents: [
              {
                id: '1',
                language: 'en',
                text: 'This is a test message for sentiment analysis.'
              }
            ]
          }
        },
        {
          headers: {
            'Ocp-Apim-Subscription-Key': process.env.AZURE_LANGUAGE_SERVICE_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.status === 200) {
        this.recordTest('Azure Language Services', true, 'Sentiment analysis working');
      } else {
        this.recordTest('Azure Language Services', false, 'Service not responding');
      }
    } catch (error) {
      this.recordTest('Azure Language Services', false, error.message);
    }
  }

  async testAzureRedisCache() {
    try {
      console.log('Testing Azure Redis Cache...');
      
      // Simple ping test
      const redisClient = require('redis').createClient({
        url: process.env.AZURE_CACHE_FOR_REDIS_CONNECTION_STRING
      });

      await redisClient.connect();
      const pong = await redisClient.ping();
      await redisClient.disconnect();

      if (pong === 'PONG') {
        this.recordTest('Azure Redis Cache', true, 'Ping successful');
      } else {
        this.recordTest('Azure Redis Cache', false, 'Ping failed');
      }
    } catch (error) {
      this.recordTest('Azure Redis Cache', false, error.message);
    }
  }

  async testNewsAPI() {
    try {
      console.log('Testing News API...');
      
      const response = await axios.get(
        'https://newsapi.org/v2/top-headlines',
        {
          params: {
            country: 'us',
            category: 'technology',
            pageSize: 5,
            apiKey: process.env.NEWS_API_KEY
          },
          timeout: 10000
        }
      );

      if (response.status === 200 && response.data.articles) {
        this.recordTest('News API', true, `Retrieved ${response.data.articles.length} articles`);
      } else {
        this.recordTest('News API', false, 'No articles returned');
      }
    } catch (error) {
      this.recordTest('News API', false, error.message);
    }
  }

  async testSerperAPI() {
    try {
      console.log('Testing Serper API...');
      
      const response = await axios.post(
        'https://google.serper.dev/search',
        {
          q: 'content marketing trends 2024',
          num: 5
        },
        {
          headers: {
            'X-API-KEY': process.env.SERP_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.status === 200 && response.data.organic) {
        this.recordTest('Serper API', true, `Retrieved ${response.data.organic.length} results`);
      } else {
        this.recordTest('Serper API', false, 'No search results returned');
      }
    } catch (error) {
      this.recordTest('Serper API', false, error.message);
    }
  }

  async testExaAPI() {
    try {
      console.log('Testing Exa API...');
      
      const response = await axios.post(
        'https://api.exa.ai/search',
        {
          query: 'artificial intelligence trends',
          numResults: 5,
          type: 'neural'
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.EXA_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.status === 200 && response.data.results) {
        this.recordTest('Exa API', true, `Retrieved ${response.data.results.length} results`);
      } else {
        this.recordTest('Exa API', false, 'No search results returned');
      }
    } catch (error) {
      this.recordTest('Exa API', false, error.message);
    }
  }

  async testSocialSearcherAPI() {
    try {
      console.log('Testing Social Searcher API...');
      
      const response = await axios.get(
        'https://api.social-searcher.com/v2/search',
        {
          params: {
            q: 'content marketing',
            type: 'web',
            key: process.env.SOCIAL_SEARCHER_API_KEY
          },
          timeout: 10000
        }
      );

      if (response.status === 200) {
        this.recordTest('Social Searcher API', true, 'API accessible');
      } else {
        this.recordTest('Social Searcher API', false, 'API not responding');
      }
    } catch (error) {
      this.recordTest('Social Searcher API', false, error.message);
    }
  }

  async testMediastackAPI() {
    try {
      console.log('Testing Mediastack API...');
      
      const response = await axios.get(
        'http://api.mediastack.com/v1/news',
        {
          params: {
            access_key: process.env.MEDIASTACK_API_KEY,
            keywords: 'technology',
            limit: 5
          },
          timeout: 10000
        }
      );

      if (response.status === 200 && response.data.data) {
        this.recordTest('Mediastack API', true, `Retrieved ${response.data.data.length} articles`);
      } else {
        this.recordTest('Mediastack API', false, 'No articles returned');
      }
    } catch (error) {
      this.recordTest('Mediastack API', false, error.message);
    }
  }

  async testQueryIntentAnalyzer() {
    try {
      console.log('Testing Query Intent Analyzer...');
      
      // Test the query intent analyzer service locally
      const response = await axios.post('http://localhost:3001/api/query-intent/analyze', {
        query: 'best content marketing strategies for B2B SaaS companies',
        segment: 'b2b',
        context: {
          industry: 'technology',
          contentType: 'blog_post'
        }
      }, {
        timeout: 15000
      });

      if (response.status === 200 && response.data.intent) {
        this.recordTest('Query Intent Analyzer', true, `Intent: ${response.data.intent.primaryIntent}`);
      } else {
        this.recordTest('Query Intent Analyzer', false, 'Service not responding correctly');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.recordTest('Query Intent Analyzer', false, 'Service not running on localhost:3001');
      } else {
        this.recordTest('Query Intent Analyzer', false, error.message);
      }
    }
  }

  async testFreshnessAggregator() {
    try {
      console.log('Testing Freshness Aggregator...');
      
      // Test the freshness aggregator service
      const response = await axios.post('http://localhost:3001/api/freshness/aggregate', {
        query: 'latest AI developments',
        segment: 'b2b',
        contentTypes: ['news', 'blog_post', 'article'],
        maxResults: 10
      }, {
        timeout: 20000
      });

      if (response.status === 200 && response.data.results) {
        this.recordTest('Freshness Aggregator', true, `Retrieved ${response.data.results.length} fresh results`);
      } else {
        this.recordTest('Freshness Aggregator', false, 'Service not responding correctly');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.recordTest('Freshness Aggregator', false, 'Service not running on localhost:3001');
      } else {
        this.recordTest('Freshness Aggregator', false, error.message);
      }
    }
  }

  async testContentOptimizer() {
    try {
      console.log('Testing Content Optimizer...');
      
      const response = await axios.post('http://localhost:3001/api/content/optimize', {
        content: 'This is a sample content to optimize for SEO and engagement.',
        targetKeywords: ['content optimization', 'SEO'],
        contentType: 'blog_post',
        audience: 'b2b'
      }, {
        timeout: 15000
      });

      if (response.status === 200) {
        this.recordTest('Content Optimizer', true, 'Optimization successful');
      } else {
        this.recordTest('Content Optimizer', false, 'Service not responding correctly');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.recordTest('Content Optimizer', false, 'Service not running on localhost:3001');
      } else {
        this.recordTest('Content Optimizer', false, error.message);
      }
    }
  }

  recordTest(serviceName, passed, message) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status} ${serviceName}: ${message}`);
    
    this.testResults[serviceName] = { passed, message };
    if (passed) {
      this.passedTests++;
    } else {
      this.failedTests++;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`📈 Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);

    if (this.failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      Object.entries(this.testResults).forEach(([service, result]) => {
        if (!result.passed) {
          console.log(`  • ${service}: ${result.message}`);
        }
      });
    }

    console.log('\n🎯 CORE SERVICES STATUS:');
    const coreServices = ['Query Intent Analyzer', 'Freshness Aggregator'];
    coreServices.forEach(service => {
      const result = this.testResults[service];
      if (result) {
        const status = result.passed ? '✅ OPERATIONAL' : '❌ ISSUES';
        console.log(`  • ${service}: ${status}`);
      } else {
        console.log(`  • ${service}: ⚠️  NOT TESTED`);
      }
    });

    console.log('\n' + '='.repeat(80));
  }
}

// Run tests
if (require.main === module) {
  const tester = new ComprehensiveApiTester();
  tester.runAllTests().catch(console.error);
}

module.exports = ComprehensiveApiTester;
