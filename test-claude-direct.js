const axios = require('axios');
require('dotenv').config();

/**
 * Direct test of Claude API to isolate the issue
 */
async function testClaudeDirectly() {
  try {
    console.log('Testing Claude API directly...');
    
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      console.error('CLAUDE_API_KEY not found in environment variables');
      return;
    }
    
    console.log('API Key found:', apiKey.substring(0, 10) + '...');
    console.log('Making request to Claude API...');
    
    // Use the latest Claude API format
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          { role: 'user', content: 'Write a short paragraph about cloud computing.' }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.content && response.data.content.length > 0) {
      console.log('Content:', response.data.content[0].text);
    }
  } catch (error) {
    console.error('Request failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testClaudeDirectly();
