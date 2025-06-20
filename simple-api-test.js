#!/usr/bin/env node

/**
 * Simple API Connectivity Test - No TypeScript compilation required
 */

require('dotenv').config();
const axios = require('axios');

console.log('🧪 SIMPLE API CONNECTIVITY TEST');
console.log('='.repeat(60));

async function testAzureOpenAI() {
  try {
    console.log('\n🔵 Testing Azure OpenAI...');
    
    const response = await axios.post(
      `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION}`,
      {
        messages: [{ role: 'user', content: 'Respond with exactly: "Azure OpenAI is working"' }],
        max_tokens: 20
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_OPENAI_API_KEY
        },
        timeout: 15000
      }
    );

    console.log('✅ Azure OpenAI: CONNECTED');
    console.log(`   Model: ${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`);
    console.log(`   Response: "${response.data.choices[0].message.content}"`);
    return true;
  } catch (error) {
    console.log('❌ Azure OpenAI: FAILED');
    console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

async function testCosmosDB() {
  try {
    console.log('\n🗄️  Testing Azure Cosmos DB...');
    
    const { CosmosClient } = require('@azure/cosmos');
    const client = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT,
      key: process.env.COSMOS_DB_KEY
    });

    const database = client.database(process.env.COSMOS_DB_DATABASE_NAME);
    const { resource } = await database.read();
    
    console.log('✅ Cosmos DB: CONNECTED');
    console.log(`   Database: ${resource.id}`);
    return true;
  } catch (error) {
    console.log('❌ Cosmos DB: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testNewsAPI() {
  try {
    console.log('\n📰 Testing News API...');
    
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        country: 'us',
        category: 'technology',
        pageSize: 5,
        apiKey: process.env.NEWS_API_KEY
      },
      timeout: 10000
    });

    console.log('✅ News API: CONNECTED');
    console.log(`   Articles retrieved: ${response.data.articles.length}`);
    return true;
  } catch (error) {
    console.log('❌ News API: FAILED');
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testSerperAPI() {
  try {
    console.log('\n🔍 Testing Serper API...');
    
    const response = await axios.post('https://google.serper.dev/search', {
      q: 'content marketing AI trends',
      num: 5
    }, {
      headers: {
        'X-API-KEY': process.env.SERP_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Serper API: CONNECTED');
    console.log(`   Results: ${response.data.organic?.length || 0} organic results`);
    return true;
  } catch (error) {
    console.log('❌ Serper API: FAILED');
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testExaAPI() {
  try {
    console.log('\n🌐 Testing Exa API...');
    
    const response = await axios.post('https://api.exa.ai/search', {
      query: 'artificial intelligence content marketing',
      numResults: 3,
      type: 'neural'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.EXA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Exa API: CONNECTED');
    console.log(`   Results: ${response.data.results?.length || 0} results`);
    return true;
  } catch (error) {
    console.log('❌ Exa API: FAILED');
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testMediastackAPI() {
  try {
    console.log('\n📺 Testing Mediastack API...');
    
    const response = await axios.get('http://api.mediastack.com/v1/news', {
      params: {
        access_key: process.env.MEDIASTACK_API_KEY,
        keywords: 'technology,ai',
        limit: 3
      },
      timeout: 10000
    });

    console.log('✅ Mediastack API: CONNECTED');
    console.log(`   Articles: ${response.data.data?.length || 0} articles`);
    return true;
  } catch (error) {
    console.log('❌ Mediastack API: FAILED');
    console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log(`Started at: ${new Date().toLocaleString()}`);
  
  const results = {
    azureOpenAI: await testAzureOpenAI(),
    cosmosDB: await testCosmosDB(),
    newsAPI: await testNewsAPI(),
    serperAPI: await testSerperAPI(),
    exaAPI: await testExaAPI(),
    mediastackAPI: await testMediastackAPI()
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([service, success]) => {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${service}`);
  });

  console.log(`\n🎯 Success Rate: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('🎉 ALL EXTERNAL APIs ARE WORKING!');
  } else {
    console.log('⚠️  Some APIs need attention');
  }

  console.log('\n📋 NEXT STEPS:');
  if (results.azureOpenAI && results.cosmosDB) {
    console.log('✅ Core Azure services are working');
    console.log('✅ Ready to test Content Architect services');
  } else {
    console.log('❌ Fix Azure service connectivity first');
  }
}

runAllTests().catch(console.error);
