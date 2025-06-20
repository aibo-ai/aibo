const { config } = require('dotenv');
const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');
const { CosmosClient } = require('@azure/cosmos');

// Load environment variables
config();

async function testAzureServices() {
  console.log('🔍 Testing Azure Services...\n');
  
  // Test Azure OpenAI
  console.log('1. Testing Azure OpenAI...');
  try {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
    console.log(`   Deployment: ${deploymentName}`);
    
    if (!apiKey) {
      throw new Error('AZURE_OPENAI_KEY not set');
    }
    
    // Simple test using fetch
    const response = await fetch(`${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-01`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello, this is a test.' }
        ],
        max_tokens: 10
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Azure OpenAI: Connected successfully');
      console.log(`   Response: ${data.choices?.[0]?.message?.content || 'No content'}`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Azure OpenAI: HTTP ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Azure OpenAI: ${error.message}`);
  }
  
  // Test Azure Cognitive Search
  console.log('\n2. Testing Azure Cognitive Search...');
  try {
    const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const apiKey = process.env.AZURE_SEARCH_KEY;
    
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
    
    if (!apiKey) {
      throw new Error('AZURE_SEARCH_KEY not set');
    }
    
    // Simple test using fetch
    const response = await fetch(`${endpoint}/indexes/content-index/docs?api-version=2020-06-30`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Azure Search: Connected successfully');
      console.log(`   Found ${data.value?.length || 0} documents in index`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Azure Search: HTTP ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Azure Search: ${error.message}`);
  }
  
  // Test Azure Cosmos DB with proper SDK
  console.log('\n3. Testing Azure Cosmos DB...');
  try {
    const endpoint = process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_DB_KEY;
    const databaseName = process.env.COSMOS_DB_DATABASE_NAME;
    
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   Key: ${key ? key.substring(0, 10) + '...' : 'NOT SET'}`);
    console.log(`   Database: ${databaseName}`);
    
    if (!key) {
      throw new Error('COSMOS_DB_KEY not set');
    }
    
    // Use proper Cosmos DB SDK
    const cosmosClient = new CosmosClient({ endpoint, key });
    const database = cosmosClient.database(databaseName);
    
    // Test database connection
    const { resource: databaseInfo } = await database.read();
    console.log('   ✅ Azure Cosmos DB: Connected successfully');
    console.log(`   Database ID: ${databaseInfo.id}`);
    
    // List containers
    const { resources: containers } = await database.containers.readAll().fetchAll();
    console.log(`   Found ${containers.length} containers: ${containers.map(c => c.id).join(', ')}`);
    
  } catch (error) {
    console.log(`   ❌ Azure Cosmos DB: ${error.message}`);
  }
  
  // Test X (Twitter) API credentials
  console.log('\n4. Testing X (Twitter) API credentials...');
  try {
    const apiKey = process.env.X_API_KEY;
    const apiSecret = process.env.X_API_SECRET;
    const bearerToken = process.env.X_BEARER_TOKEN;
    const endpoint = process.env.X_API_ENDPOINT;
    
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
    console.log(`   API Secret: ${apiSecret ? apiSecret.substring(0, 10) + '...' : 'NOT SET'}`);
    console.log(`   Bearer Token: ${bearerToken ? bearerToken.substring(0, 10) + '...' : 'NOT SET'}`);
    console.log(`   Endpoint: ${endpoint || 'NOT SET'}`);
    
    if (!bearerToken) {
      throw new Error('X_BEARER_TOKEN not set');
    }
    
    // Test X API v2 with bearer token
    const response = await fetch('https://api.twitter.com/2/tweets/search/recent?query=hello&max_results=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ X (Twitter) API: Connected successfully');
      console.log(`   Found ${data.data?.length || 0} tweets`);
      if (data.data?.length > 0) {
        console.log(`   Sample tweet: ${data.data[0].text.substring(0, 100)}...`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ X (Twitter) API: HTTP ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ X (Twitter) API: ${error.message}`);
  }
  
  console.log('\n✅ Azure Services & X API Test Complete');
}

testAzureServices().catch(console.error);
