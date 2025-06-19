import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkSerpKey() {
  const apiKey = process.env.SERP_API_KEY;
  
  if (!apiKey) {
    console.error('SERP_API_KEY is not set in .env file');
    return;
  }

  console.log('SERP API Key (first 5 chars):', `${apiKey.substring(0, 5)}...`);
  console.log('Key length:', apiKey.length);

  try {
    const response = await axios.get('https://serpapi.com/account', {
      params: {
        api_key: apiKey,
        output: 'json'
      },
      timeout: 10000
    });

    console.log('\n=== SERP API Account Information ===');
    console.log('Status:', response.status);
    console.log('Plan:', response.data.plan_name);
    console.log('Searches Used:', response.data.searches_used);
    console.log('Searches Remaining:', response.data.searches_remaining);
    console.log('Total Searches:', response.data.searches_total);
    console.log('==================================');
  } catch (error) {
    console.error('\n=== Error Checking SERP API Key ===');
    console.error('Status:', error.response?.status || 'No response');
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response?.data?.error) {
      console.error('API Error:', error.response.data.error);
    }
    
    console.error('=================================');
  }
}

checkSerpKey().catch(console.error);
