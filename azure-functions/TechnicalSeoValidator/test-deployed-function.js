const fetch = require('node-fetch');

async function testDeployedFunction() {
  const functionKey = '7i-A0QC9uKBLUQsl83ANmdQda7INdJWBP_AjT5eZDM1NAzFu7L7hdQ==';
  const functionUrl = `https://ca-seo-validator.azurewebsites.net/api/validate?code=${functionKey}`;
  
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Page</title>
      <meta name="description" content="Test page for SEO validation">
    </head>
    <body>
      <!-- Missing H1 tag -->
      <h2>Secondary Heading</h2>
      <p>This is a test paragraph.</p>
      <img src="test.jpg" /> <!-- Missing alt text -->
      <form>
        <input type="text" name="username" /> <!-- Missing label -->
        <button type="submit">Submit</button>
      </form>
    </body>
    </html>
  `;

  try {
    console.log('Testing deployed Technical SEO Validator function...');
    console.log(`Function URL: ${functionUrl}`);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html: testHtml,
        contentType: 'text/html',
        validateSemanticHtml: true,
        validateAccessibility: true
      })
    });

    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Response: ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log('Validation Result:');
    console.log(`Score: ${JSON.stringify(result.score, null, 2)}`);
    console.log(`Issues found: ${result.issues.length}`);
    console.log('First 3 issues:');
    console.log(result.issues.slice(0, 3).map(issue => issue.message));
    console.log('\nRecommendations:');
    console.log(result.recommendations);
  } catch (error) {
    console.error('Error testing function:', error);
  }
}

testDeployedFunction();
