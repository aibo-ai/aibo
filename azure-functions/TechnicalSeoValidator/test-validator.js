const httpTrigger = require('../../dist/azure-functions/TechnicalSeoValidator/index').default;
const { Context } = require('@azure/functions');

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
    console.log('Testing HTML validation...');
    
    // Create mock context and request objects
    const context = {
      log: console.log,
      done: () => {},
      res: {
        status: null,
        body: null,
        headers: {}
      }
    };
    
    const req = {
      body: {
        html: sampleHtml,
        contentType: 'webpage',
        validateAccessibility: true,
        validateSemanticHtml: true,
        validateHeadingStructure: true
      }
    };
    
    // Call the Azure Function
    await httpTrigger(context, req);
    
    // Check the result
    if (context.res.status === 200) {
      const result = context.res.body;
      
      console.log('HTML Validation Result:');
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
      console.error('Function returned error status:', context.res.status);
      console.error('Error:', context.res.body);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest();
