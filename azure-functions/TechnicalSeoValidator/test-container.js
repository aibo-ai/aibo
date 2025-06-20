const fetch = require('node-fetch');

async function testContainerizedValidator() {
  // Update this URL after deployment
  const containerUrl = 'http://ca-seo-validator.eastus.azurecontainer.io:8080';
  
  const testHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Test Page for SEO Validation</title>
      <meta name="description" content="Test page for SEO validation">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
      <h1>Main Heading</h1>
      <h2>Secondary Heading</h2>
      <p>This is a test paragraph with proper semantic structure.</p>
      
      <!-- Accessibility issues for testing -->
      <img src="test.jpg" /> <!-- Missing alt text -->
      <form>
        <input type="text" name="username" /> <!-- Missing label -->
        <button type="submit">Submit</button>
      </form>
      
      <!-- Poor heading structure -->
      <h4>Skipped H3</h4>
      
      <!-- Missing semantic elements -->
      <div onclick="doSomething()">Click me</div> <!-- Should be a button -->
    </body>
    </html>
  `;

  try {
    // First, check health endpoint
    console.log('Checking container health...');
    const healthResponse = await fetch(`${containerUrl}/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('Health check:', health);
    } else {
      console.error('Health check failed:', healthResponse.status);
      return;
    }

    // Test validation endpoint
    console.log('\nTesting Technical SEO Validator...');
    console.log(`Endpoint: ${containerUrl}/api/validate`);
    
    const response = await fetch(`${containerUrl}/api/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html: testHtml,
        contentType: 'text/html',
        validateSemanticHtml: true,
        validateAccessibility: true,
        validateHeadingStructure: true,
        validateMetaTags: true,
        validateImages: true
      })
    });

    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Response: ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log('\nValidation Result:');
    console.log('=================');
    console.log(`Overall Score: ${result.score.overall}/100`);
    console.log(`Accessibility Score: ${result.score.accessibility}/100`);
    console.log(`Semantic Structure Score: ${result.score.semanticStructure}/100`);
    console.log(`Mobile Friendly Score: ${result.score.mobileFriendly}/100`);
    
    console.log(`\nTotal Issues Found: ${result.issues.length}`);
    console.log('\nIssue Breakdown:');
    console.log(`- Critical: ${result.metrics.criticalIssues}`);
    console.log(`- High: ${result.metrics.highIssues}`);
    console.log(`- Medium: ${result.metrics.mediumIssues}`);
    console.log(`- Low: ${result.metrics.lowIssues}`);
    
    console.log('\nTop 5 Issues:');
    result.issues.slice(0, 5).forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity}] ${issue.message}`);
      if (issue.element) {
        console.log(`   Element: ${issue.element}`);
      }
    });
    
    console.log('\nRecommendations:');
    result.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
  } catch (error) {
    console.error('Error testing container:', error);
  }
}

// Run the test
testContainerizedValidator();
