/**
 * Technical SEO Validator Dual Deployment Test
 * 
 * This script tests both the serverless and containerized Technical SEO Validators
 * to verify that our dual validator approach is working correctly.
 */
require('dotenv').config();
const axios = require('axios');

// Configuration
const serverlessUrl = process.env.TECHNICAL_SEO_VALIDATOR_SERVERLESS_URL || 
  'https://ca-seo-validator.azurewebsites.net/api/validate';
const serverlessKey = process.env.TECHNICAL_SEO_VALIDATOR_SERVERLESS_KEY || '';
const containerUrl = process.env.TECHNICAL_SEO_VALIDATOR_CONTAINER_URL || 
  'http://ca-seo-validator.eastus.azurecontainer.io:8080/api/validate';
const containerKey = process.env.TECHNICAL_SEO_VALIDATOR_CONTAINER_KEY || '';

// Test HTML samples
const goodHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="A well-structured page with good SEO practices">
  <title>SEO Best Practices Example</title>
</head>
<body>
  <header>
    <h1>Welcome to our SEO-Friendly Page</h1>
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <article>
      <h2>Main Content Section</h2>
      <p>This is a paragraph with meaningful content that search engines can understand.</p>
      <img src="example.jpg" alt="A descriptive alt text for the image" width="300" height="200">
      <section>
        <h3>Subsection with Proper Heading Structure</h3>
        <p>Another paragraph with relevant content and <a href="https://example.com">proper link text</a>.</p>
      </section>
    </article>
  </main>
  <footer>
    <p>&copy; 2025 Example Company</p>
  </footer>
</body>
</html>`;

const badHtml = `<html>
<body>
  <div>
    <div>Welcome to my page</div>
    <img src="img.jpg">
    <a href="#">Click here</a>
    <div>
      <div>Some content</div>
    </div>
  </div>
</body>
</html>`;

// Test URLs
const testUrls = [
  'https://example.com',
  'https://www.wikipedia.org'
];

// Test functions
async function testServerlessValidator() {
  console.log('\n=== Testing Serverless Validator (HTML Only) ===');
  
  try {
    console.log('Sending good HTML to serverless validator...');
    const goodHtmlResponse = await axios.post(serverlessUrl, 
      { html: goodHtml },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'x-functions-key': serverlessKey
        }
      }
    );
    
    console.log('✅ Serverless validator responded successfully!');
    console.log(`Overall score: ${goodHtmlResponse.data.score?.overall || 'N/A'}`);
    console.log(`Total issues: ${goodHtmlResponse.data.metrics?.totalIssues || 'N/A'}`);
    
    console.log('\nSending bad HTML to serverless validator...');
    const badHtmlResponse = await axios.post(serverlessUrl, 
      { html: badHtml },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'x-functions-key': serverlessKey
        }
      }
    );
    
    console.log('✅ Serverless validator responded successfully!');
    console.log(`Overall score: ${badHtmlResponse.data.score?.overall || 'N/A'}`);
    console.log(`Total issues: ${badHtmlResponse.data.metrics?.totalIssues || 'N/A'}`);
    
    return true;
  } catch (error) {
    console.log('❌ Error testing serverless validator:');
    console.log(error.response?.data || error.message);
    return false;
  }
}

async function testContainerValidator() {
  console.log('\n=== Testing Container Validator (URL Support) ===');
  
  try {
    // Test URL validation (should only work with container validator)
    console.log(`Sending URL (${testUrls[0]}) to container validator...`);
    const urlResponse = await axios.post(containerUrl, 
      { url: testUrls[0] },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': containerKey
        }
      }
    );
    
    console.log('✅ Container validator responded successfully!');
    console.log(`Overall score: ${urlResponse.data.score?.overall || 'N/A'}`);
    console.log(`Total issues: ${urlResponse.data.metrics?.totalIssues || 'N/A'}`);
    
    // Also test HTML validation with container
    console.log('\nSending HTML to container validator...');
    const htmlResponse = await axios.post(containerUrl, 
      { html: goodHtml },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': containerKey
        }
      }
    );
    
    console.log('✅ Container validator responded successfully!');
    console.log(`Overall score: ${htmlResponse.data.score?.overall || 'N/A'}`);
    console.log(`Total issues: ${htmlResponse.data.metrics?.totalIssues || 'N/A'}`);
    
    return true;
  } catch (error) {
    console.log('❌ Error testing container validator:');
    console.log(error.response?.data || error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('Technical SEO Validator Dual Deployment Test');
  console.log('==========================================');
  console.log(`Serverless Validator URL: ${serverlessUrl}`);
  console.log(`Container Validator URL: ${containerUrl}`);
  
  let serverlessSuccess = false;
  let containerSuccess = false;
  
  try {
    serverlessSuccess = await testServerlessValidator();
  } catch (error) {
    console.error('Error testing serverless validator:', error);
  }
  
  try {
    containerSuccess = await testContainerValidator();
  } catch (error) {
    console.error('Error testing container validator:', error);
  }
  
  console.log('\n=== Test Summary ===');
  console.log(`Serverless Validator: ${serverlessSuccess ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Container Validator: ${containerSuccess ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Dual Validator Setup: ${(serverlessSuccess || containerSuccess) ? '✅ OPERATIONAL' : '❌ FAILED'}`);
  
  if (serverlessSuccess && !containerSuccess) {
    console.log('\n⚠️ WARNING: Only the serverless validator is working. URL validation will not be available.');
    console.log('The client will fall back to serverless HTML-only validation.');
  } else if (!serverlessSuccess && containerSuccess) {
    console.log('\n⚠️ WARNING: Only the container validator is working.');
    console.log('The client will use the container for all validations.');
  } else if (!serverlessSuccess && !containerSuccess) {
    console.log('\n❌ CRITICAL ERROR: Both validators are not working!');
    console.log('Please check your deployment and configuration.');
  } else {
    console.log('\n✅ SUCCESS: Both validators are working!');
    console.log('The client will use the optimal validator based on the input type:');
    console.log('- Serverless validator for HTML content (faster, lightweight)');
    console.log('- Container validator for URL validation (with Puppeteer support)');
  }
}

runTests().catch(console.error);
