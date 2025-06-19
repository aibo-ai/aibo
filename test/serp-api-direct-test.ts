import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

async function testSerpApi() {
  const apiKey = process.env.SERP_API_KEY;
  const query = 'artificial intelligence';
  
  console.log('Testing SERP API with key:', `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);
  
  try {
    // Test 1: Check account status
    console.log('\n1. Testing account status...');
    const accountResponse = await axios.get('https://serpapi.com/account', {
      params: { api_key: apiKey }
    });
    console.log('Account Status:', accountResponse.data);
    
    // Test 2: Perform a search
    console.log('\n2. Testing search...');
    const searchParams = new URLSearchParams({
      q: query,
      api_key: apiKey,
      engine: 'google',
      num: '3'  // Must be a string for URLSearchParams
    });
    
    const searchResponse = await axios.get('https://serpapi.com/search', {
      params: searchParams,
      timeout: 10000
    });
    
    console.log('Search Results:');
    console.log(`- Status: ${searchResponse.status}`);
    console.log(`- Results: ${searchResponse.data?.organic_results?.length || 0}`);
    
    if (searchResponse.data?.organic_results?.length > 0) {
      console.log('First result:', {
        title: searchResponse.data.organic_results[0].title,
        link: searchResponse.data.organic_results[0].link
      });
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    }
  }
}

testSerpApi().catch(console.error);
