const axios = require('axios');

async function testFreshnessAggregator() {
  try {
    console.log('Testing Freshness Aggregator via NestJS endpoint...');
    
    // Using the NestJS endpoint instead of the Azure Function
    const response = await axios.get('http://localhost:3001/bottom-layer/fresh-content', {
      params: {
        topic: 'artificial intelligence trends',
        segment: 'b2c'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error testing function:', error.message);
    console.error('Error details:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testFreshnessAggregator();
