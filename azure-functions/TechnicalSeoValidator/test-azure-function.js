const { app } = require('@azure/functions');

// Mock Azure Functions context
const createMockContext = () => {
  return {
    log: {
      info: console.log,
      error: console.error,
      warn: console.warn,
      verbose: console.log
    },
    done: () => {},
    res: {}
  };
};

// Mock Azure Functions request
const createMockRequest = (body) => {
  return {
    method: 'POST',
    url: '/api/TechnicalSeoValidator',
    headers: {
      'content-type': 'application/json'
    },
    body: body,
    query: {},
    params: {}
  };
};

// Sample HTML content for testing
const sampleHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Page</title>
  <meta name="description" content="Test page for SEO validation">
</head>
<body>
  <!-- Missing H1 tag -->
  <h2>This is a secondary heading</h2>
  
  <!-- Missing alt text -->
  <img src="test.jpg">
  
  <!-- Empty link -->
  <a href="#">Click here</a>
  
  <!-- Form without labels -->
  <form>
    <input type="text" placeholder="Name">
    <input type="email" placeholder="Email">
    <button type="submit">Submit</button>
  </form>
  
  <p>This is a test paragraph.</p>
</body>
</html>
`;

async function runTest() {
  try {
    console.log('Loading Azure Function...');
    
    // Import the Azure Function
    const azureFunction = require('../../dist/azure-functions/TechnicalSeoValidator/index');
    
    // Create mock context and request
    const context = createMockContext();
    const request = createMockRequest({
      html: sampleHtml,
      contentType: 'webpage',
      validateAccessibility: true,
      validateSemanticHtml: true,
      validateHeadingStructure: true
    });
    
    console.log('Executing Azure Function...');
    
    // Execute the Azure Function
    const response = await azureFunction.default(context, request);
    
    console.log('\nAzure Function Response:');
    console.log('Status:', response.status);
    
    if (response.status === 200) {
      const result = response.body;
      console.log('\nValidation Result:');
      console.log('Score:', result.score);
      console.log('Issues found:', result.issues.length);
      console.log('Issues by category:');
      
      const categories = {};
      result.issues.forEach(issue => {
        categories[issue.category] = (categories[issue.category] || 0) + 1;
      });
      
      console.log(categories);
      console.log('\nFirst 3 issues:');
      console.log(result.issues.slice(0, 3).map(i => `${i.title}: ${i.description}`));
      
      console.log('\nRecommendations:');
      console.log(result.recommendations.slice(0, 3));
    } else {
      console.log('Error:', response.body);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest();
