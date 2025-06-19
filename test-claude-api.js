const axios = require('axios');

/**
 * Simple test script to verify the Claude API integration
 */
async function testClaudeApi() {
  try {
    console.log('Testing Claude API integration...');
    
    const response = await axios.post('http://localhost:3001/llm-content/generate', {
      topic: 'Cloud Computing Technology Trends',
      contentType: 'blog_post',
      audience: 'b2b',
      toneOfVoice: 'formal',
      targetLength: 'medium',
      purpose: 'educate IT decision makers',
      keyPoints: [
        'Serverless architecture',
        'Multi-cloud strategies',
        'AI/ML integration'
      ],
      searchKeywords: ['cloud computing', 'serverless', 'AI integration']
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    
    if (response.data.error) {
      console.error('API Error:', response.data.error);
    } else if (response.data.data) {
      console.log('Success! Content title:', response.data.data.title);
      console.log('Summary:', response.data.data.summary);
      console.log('Number of sections:', response.data.data.sections.length);
    } else {
      console.log('Unexpected response structure:', response.data);
    }
  } catch (error) {
    console.error('Request failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
    } else {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

testClaudeApi();
