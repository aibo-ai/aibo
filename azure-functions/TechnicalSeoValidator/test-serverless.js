const fetch = require('node-fetch');
const fs = require('fs');

/**
 * Test script for the Technical SEO Validator (Serverless Version)
 * This script tests the HTML validation functionality of the serverless validator
 */

// Configuration
const LOCAL_ENDPOINT = 'http://localhost:7071/api/validate-serverless';
const AZURE_ENDPOINT = 'https://ca-seo-validator.azurewebsites.net/api/validate-serverless';
const FUNCTION_KEY = ''; // Add your function key here if testing against Azure

// Sample HTML with various SEO issues to test
const sampleHtml = `
<!DOCTYPE html>
<html>
<head>
  <!-- Missing title tag -->
  <!-- Missing meta description -->
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Missing H1 heading -->
  <h2>Welcome to our website</h2>
  
  <!-- Skipped heading level -->
  <h4>This is a subheading</h4>
  
  <!-- Image without alt text -->
  <img src="image.jpg">
  
  <!-- Form input without label -->
  <form>
    <input type="text" name="name">
    <button type="submit">Submit</button>
  </form>
  
  <p>This is a paragraph with some text.</p>
  
  <!-- Link without descriptive text -->
  <a href="page.html">Click here</a>
</body>
</html>
`;

// Sample HTML with good SEO practices
const goodHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Technical SEO Validator Test Page</title>
  <meta charset="utf-8">
  <meta name="description" content="This is a test page for the Technical SEO Validator with good SEO practices.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta property="og:title" content="Technical SEO Validator Test">
  <meta property="og:description" content="Testing the Technical SEO Validator">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>Technical SEO Validator Test</h1>
    <nav>
      <ul>
        <li><a href="index.html">Home</a></li>
        <li><a href="about.html">About Us</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <section>
      <h2>About the Validator</h2>
      <p>This page demonstrates good SEO practices for testing the Technical SEO Validator.</p>
      
      <h3>Features</h3>
      <ul>
        <li>Proper heading structure</li>
        <li>Semantic HTML elements</li>
        <li>Alt text for images</li>
        <li>Descriptive link text</li>
      </ul>
    </section>
    
    <section>
      <h2>Example Content</h2>
      <img src="example.jpg" alt="Example image showing good SEO practices">
      <p>This is an example paragraph with a <a href="more-info.html">link to more information</a>.</p>
      
      <form>
        <label for="name">Your Name:</label>
        <input type="text" id="name" name="name">
        <button type="submit">Submit</button>
      </form>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2025 Technical SEO Validator</p>
  </footer>
</body>
</html>
`;

/**
 * Test the validator with HTML content
 */
async function testValidator(html, description) {
  console.log(`\n=== Testing ${description} ===`);
  
  try {
    // Determine which endpoint to use (local or Azure)
    const endpoint = process.env.USE_AZURE === 'true' 
      ? `${AZURE_ENDPOINT}?code=${FUNCTION_KEY}`
      : LOCAL_ENDPOINT;
    
    console.log(`Sending request to: ${endpoint}`);
    
    // Send the validation request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html: html,
        contentType: 'ARTICLE',
        validateSemanticHtml: true,
        validateAccessibility: true,
        validateHeadingStructure: true,
        validateMetaTags: true,
        validateImages: true,
        validateLinks: true
      })
    });
    
    // Parse the response
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Validation successful!');
      console.log(`Overall Score: ${result.score.overall}/100`);
      console.log(`Total Issues: ${result.metrics.totalIssues}`);
      
      // Print issues by severity
      console.log('\nIssues by Severity:');
      console.log(`- Critical: ${result.metrics.criticalIssues}`);
      console.log(`- High: ${result.metrics.highIssues}`);
      console.log(`- Medium: ${result.metrics.mediumIssues}`);
      console.log(`- Low: ${result.metrics.lowIssues}`);
      
      // Print top recommendations
      console.log('\nTop Recommendations:');
      result.recommendations.slice(0, 5).forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
      
      // Save the full result to a file
      const filename = `validation-result-${description.toLowerCase().replace(/\s+/g, '-')}.json`;
      fs.writeFileSync(filename, JSON.stringify(result, null, 2));
      console.log(`\nFull results saved to: ${filename}`);
    } else {
      console.error('❌ Validation failed!');
      console.error(result);
    }
  } catch (error) {
    console.error('❌ Error testing validator:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Technical SEO Validator (Serverless) Test');
  console.log('=======================================');
  console.log('Testing against endpoint:', process.env.USE_AZURE === 'true' ? 'Azure' : 'Local');
  
  // Test with sample HTML that has SEO issues
  await testValidator(sampleHtml, 'Sample HTML with SEO Issues');
  
  // Test with good HTML that follows SEO best practices
  await testValidator(goodHtml, 'Good HTML with SEO Best Practices');
}

// Run the tests
main().catch(console.error);
