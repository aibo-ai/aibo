const axios = require('axios');

async function testFullIntegration() {
  try {
    console.log('Testing full integration flow...');
    
    // Step 1: Analyze intent
    console.log('Step 1: Analyzing intent for "quantum computing applications"...');
    const intentResponse = await axios.post('http://localhost:3001/bottom-layer/analyze-intent', {
      topic: 'quantum computing applications',
      context: 'research and development'
    }, {
      params: {
        segment: 'b2b'
      }
    });
    
    console.log('Intent analysis complete. Intent:', intentResponse.data.primaryIntent);
    console.log('Key themes:', intentResponse.data.keyThemes);
    
    // Step 2: Get fresh content based on the analyzed intent
    console.log('\nStep 2: Getting fresh content for "quantum computing applications"...');
    const freshContentResponse = await axios.get('http://localhost:3001/bottom-layer/fresh-content', {
      params: {
        topic: 'quantum computing applications',
        segment: 'b2b'
      }
    });
    
    console.log('Fresh content retrieved. Total items:', freshContentResponse.data.items.length);
    console.log('Content sources:', freshContentResponse.data.sources);
    console.log('Execution time:', freshContentResponse.data.executionTime, 'ms');
    
    // Step 3: Display top 3 freshest items
    console.log('\nTop 3 freshest content items:');
    const topItems = freshContentResponse.data.items.slice(0, 3);
    
    topItems.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.title}`);
      console.log(`   URL: ${item.url}`);
      console.log(`   Source: ${item.source}`);
      console.log(`   Freshness score: ${item.freshness?.score || 'N/A'}`);
      console.log(`   Content type: ${item.contentType}`);
    });
    
    return {
      intentAnalysis: intentResponse.data,
      freshContent: freshContentResponse.data
    };
  } catch (error) {
    console.error('Error in integration test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testFullIntegration();
