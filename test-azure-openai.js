const https = require('https');
require('dotenv').config();

async function testAzureOpenAI() {
  console.log('🧪 Testing Azure OpenAI Connection...\n');
  
  // Get configuration from environment
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
  
  console.log('Configuration:');
  console.log(`Endpoint: ${endpoint}`);
  console.log(`API Key: ${apiKey ? `${apiKey.substring(0, 10)}...` : 'Not set'}`);
  console.log(`Deployment: ${deploymentName}`);
  console.log(`API Version: ${apiVersion}\n`);
  
  if (!endpoint || !apiKey || !deploymentName) {
    console.log('❌ Missing required configuration');
    return;
  }
  
  // Test 1: Check if service is reachable
  console.log('🔍 Test 1: Checking service endpoint...');
  try {
    const testUrl = `${endpoint}openai/deployments?api-version=${apiVersion}`;
    console.log(`Testing URL: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Response Status: ${response.status}`);
    console.log(`Response Headers: ${JSON.stringify([...response.headers.entries()], null, 2)}`);
    
    const responseText = await response.text();
    console.log(`Response Body: ${responseText.substring(0, 500)}...\n`);
    
    if (response.ok) {
      console.log('✅ Service endpoint is reachable');
      const deployments = JSON.parse(responseText);
      console.log(`Available deployments: ${JSON.stringify(deployments, null, 2)}`);
    } else {
      console.log(`❌ Service endpoint returned error: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Service endpoint test failed: ${error.message}`);
  }
  
  // Test 2: Try specific deployment
  console.log('\n🔍 Test 2: Testing specific deployment...');
  try {
    const chatUrl = `${endpoint}openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
    console.log(`Testing deployment URL: ${chatUrl}`);
    
    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello, test message' }
        ],
        max_tokens: 5
      })
    });
    
    console.log(`Deployment Response Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`Deployment Response: ${responseText.substring(0, 500)}...\n`);
    
    if (response.ok) {
      console.log('✅ Deployment is working correctly');
    } else {
      console.log(`❌ Deployment test failed: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Deployment test failed: ${error.message}`);
  }
}

testAzureOpenAI().catch(console.error);
