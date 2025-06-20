require('dotenv').config();

async function testSerpAPI() {
  console.log('🧪 Testing SerpAPI Specifically...\n');
  
  const apiKey = process.env.SERP_API_KEY;
  console.log(`API Key: ${apiKey ? `${apiKey.substring(0, 20)}...` : 'Not set'}`);
  
  if (!apiKey) {
    console.log('❌ SERP_API_KEY not set');
    return;
  }
  
  try {
    // Test SerpAPI endpoint
    const url = `https://serpapi.com/search?engine=google&q=test&api_key=${apiKey}`;
    console.log(`Testing URL: ${url.replace(apiKey, 'HIDDEN_KEY')}`);
    
    const response = await fetch(url);
    
    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    const result = await response.text();
    console.log(`Response length: ${result.length}`);
    console.log(`Response preview: ${result.substring(0, 200)}...`);
    
    if (response.ok) {
      console.log('✅ SerpAPI working correctly!');
      const data = JSON.parse(result);
      console.log(`Results found: ${data.organic_results ? data.organic_results.length : 0}`);
    } else {
      console.log(`❌ SerpAPI failed with status ${response.status}`);
      console.log(`Error: ${result}`);
    }
    
  } catch (error) {
    console.log(`❌ SerpAPI test failed: ${error.message}`);
  }
}

testSerpAPI().catch(console.error);
