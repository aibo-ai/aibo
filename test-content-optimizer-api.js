require('dotenv').config();
const axios = require('axios');

/**
 * Test script for the LLM content optimizer API endpoint
 */
async function testContentOptimizerAPI() {
  console.log('Testing LLM Content Optimizer API endpoint...');
  
  try {
    // Define the API endpoint
    const apiUrl = 'http://localhost:3001/api/llm-content/generate';
    
    // Define the request payload
    const payload = {
      topic: 'Cloud Computing Technology Trends',
      contentType: 'blog_post',
      audience: 'b2b',
      toneOfVoice: 'formal',
      keypoints: [
        'Edge computing integration',
        'Multi-cloud strategies',
        'AI-powered cloud services',
        'Serverless architecture adoption',
        'Cloud security innovations'
      ],
      targetLength: 'medium'
    };
    
    console.log('Sending request to Content Optimizer API...');
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    // Make the API call
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 seconds timeout
    });
    
    if (response.status === 200 || response.status === 201) {
      console.log('API call successful!');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      // Check if Claude was used or if it fell back to Azure OpenAI
      const provider = response.data.provider || 'unknown';
      console.log('Content generated using provider:', provider);
      
      return response.data;
    } else {
      console.error('Unexpected response status:', response.status);
      console.error('Response data:', response.data);
    }
  } catch (error) {
    console.error('Error calling Content Optimizer API:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Is the backend server running?');
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

// Run the test
testContentOptimizerAPI();
