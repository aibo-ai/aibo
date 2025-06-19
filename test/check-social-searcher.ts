import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSocialSearcher() {
  const apiKey = process.env.SOCIAL_SEARCHER_API_KEY;
  
  if (!apiKey) {
    console.error('SOCIAL_SEARCHER_API_KEY is not set in .env file');
    return;
  }

  console.log('Social Searcher API Key (first 5 chars):', `${apiKey.substring(0, 5)}...`);
  console.log('Key length:', apiKey.length);

  // Test with minimal parameters first
  const testCases = [
    {
      name: 'Minimal parameters',
      params: {
        q: 'test',
        key: apiKey,
        networks: 'twitter',
        limit: 5
      }
    },
    {
      name: 'With sort parameter',
      params: {
        q: 'test',
        key: apiKey,
        networks: 'twitter',
        limit: 5,
        sort: 'date'
      }
    },
    {
      name: 'With lang parameter',
      params: {
        q: 'test',
        key: apiKey,
        networks: 'twitter',
        limit: 5,
        lang: 'en'
      }
    },
    {
      name: 'With page parameter',
      params: {
        q: 'test',
        key: apiKey,
        networks: 'twitter',
        limit: 5,
        page: 1
      }
    },
    {
      name: 'Original failing parameters',
      params: {
        q: 'artificial intelligence',
        key: apiKey,
        networks: 'twitter',
        lang: 'en',
        page: 1,
        limit: 5,
        sort: 'date'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== Testing: ${testCase.name} ===`);
    console.log('Params:', { ...testCase.params, key: '***' });
    
    try {
      const response = await axios.get('https://api.social-searcher.com/v2/search', {
        params: testCase.params,
        timeout: 10000
      });

      console.log('Status:', response.status);
      console.log('Results:', response.data.posts?.length || 0);
      console.log('Rate Limit:', response.headers['x-ratelimit-remaining']);
      
      if (response.data.posts?.length > 0) {
        console.log('First result:', {
          text: response.data.posts[0].text?.substring(0, 100) + '...',
          network: response.data.posts[0].network,
          created: response.data.posts[0].created
        });
      }
    } catch (error) {
      console.error('Error:', error.message);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      } else if (error.request) {
        console.error('No response received');
      }
    }
    
    console.log('===============================');
    
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testSocialSearcher().catch(console.error);
