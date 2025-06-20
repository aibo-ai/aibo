/**
 * Technical SEO Validator Integration Test
 * 
 * This script tests the integration of the Technical SEO Validator with the Content Architect system.
 * It verifies that both the serverless and containerized validators are properly configured and working.
 */
require('dotenv').config();
const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const SERVERLESS_URL = process.env.TECHNICAL_SEO_VALIDATOR_SERVERLESS_URL || 
  'https://ca-seo-validator.azurewebsites.net/api/validate';
const CONTAINER_URL = process.env.TECHNICAL_SEO_VALIDATOR_CONTAINER_URL || 
  'http://ca-seo-validator.eastus.azurecontainer.io:8080/api/validate';

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
  </header>
  <main>
    <article>
      <h2>Main Content Section</h2>
      <p>This is a paragraph with meaningful content that search engines can understand.</p>
      <img src="example.jpg" alt="A descriptive alt text for the image" width="300" height="200">
    </article>
  </main>
  <footer>
    <p>&copy; 2025 Example Company</p>
  </footer>
</body>
</html>`;

// Test URLs
const testUrl = 'https://example.com';

// Test functions
async function testNestJsIntegration() {
  console.log('\n=== Testing NestJS Technical SEO Validator Integration ===');
  
  try {
    // Test health endpoint
    console.log('Checking validator health...');
    const healthResponse = await axios.get(`${API_BASE_URL}/technical-seo-validator/health`);
    
    console.log('✅ Health check successful!');
    console.log('Health status:');
    console.log(`- Serverless validator: ${healthResponse.data.serverless.available ? '✅ Available' : '❌ Unavailable'}`);
    console.log(`- Container validator: ${healthResponse.data.container.available ? '✅ Available' : '❌ Unavailable'}`);
    console.log(`- Overall status: ${healthResponse.data.overall.available ? '✅ Available' : '❌ Unavailable'}`);
    console.log(`- Preferred validator: ${healthResponse.data.overall.preferredValidator}`);
    
    // Test HTML validation
    console.log('\nTesting HTML validation...');
    const htmlResponse = await axios.post(
      `${API_BASE_URL}/technical-seo-validator/validate-html`,
      { html: goodHtml }
    );
    
    console.log('✅ HTML validation successful!');
    console.log(`Overall score: ${htmlResponse.data.score?.overall || 'N/A'}`);
    console.log(`Total issues: ${htmlResponse.data.metrics?.totalIssues || 'N/A'}`);
    
    // Test URL validation
    console.log('\nTesting URL validation...');
    const urlResponse = await axios.post(
      `${API_BASE_URL}/technical-seo-validator/validate-url`,
      { url: testUrl }
    );
    
    console.log('✅ URL validation successful!');
    console.log(`Overall score: ${urlResponse.data.score?.overall || 'N/A'}`);
    console.log(`Total issues: ${urlResponse.data.metrics?.totalIssues || 'N/A'}`);
    
    // Test smart validation with URL
    console.log('\nTesting smart validation with URL...');
    const smartUrlResponse = await axios.post(
      `${API_BASE_URL}/technical-seo-validator/validate`,
      { url: testUrl }
    );
    
    console.log('✅ Smart URL validation successful!');
    console.log(`Overall score: ${smartUrlResponse.data.score?.overall || 'N/A'}`);
    
    // Test smart validation with HTML
    console.log('\nTesting smart validation with HTML...');
    const smartHtmlResponse = await axios.post(
      `${API_BASE_URL}/technical-seo-validator/validate`,
      { html: goodHtml }
    );
    
    console.log('✅ Smart HTML validation successful!');
    console.log(`Overall score: ${smartHtmlResponse.data.score?.overall || 'N/A'}`);
    
    return true;
  } catch (error) {
    console.log('❌ Error testing NestJS integration:');
    console.log(error.response?.data || error.message);
    return false;
  }
}

async function testDirectValidators() {
  console.log('\n=== Testing Direct Validator Access ===');
  
  let serverlessSuccess = false;
  let containerSuccess = false;
  
  // Test serverless validator
  try {
    console.log(`Testing serverless validator: ${SERVERLESS_URL}`);
    const serverlessResponse = await axios.post(
      SERVERLESS_URL,
      { html: goodHtml },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'x-functions-key': process.env.TECHNICAL_SEO_VALIDATOR_SERVERLESS_KEY || ''
        }
      }
    );
    
    console.log('✅ Serverless validator responded successfully!');
    console.log(`Overall score: ${serverlessResponse.data.score?.overall || 'N/A'}`);
    serverlessSuccess = true;
  } catch (error) {
    console.log('❌ Error testing serverless validator:');
    console.log(error.response?.data || error.message);
  }
  
  // Test container validator
  try {
    console.log(`\nTesting container validator: ${CONTAINER_URL}`);
    const containerResponse = await axios.post(
      CONTAINER_URL,
      { url: testUrl },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': process.env.TECHNICAL_SEO_VALIDATOR_CONTAINER_KEY || ''
        }
      }
    );
    
    console.log('✅ Container validator responded successfully!');
    console.log(`Overall score: ${containerResponse.data.score?.overall || 'N/A'}`);
    containerSuccess = true;
  } catch (error) {
    console.log('❌ Error testing container validator:');
    console.log(error.response?.data || error.message);
  }
  
  return { serverlessSuccess, containerSuccess };
}

// Run tests
async function runTests() {
  console.log('Technical SEO Validator Integration Test');
  console.log('=======================================');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Serverless Validator URL: ${SERVERLESS_URL}`);
  console.log(`Container Validator URL: ${CONTAINER_URL}`);
  
  // Test direct validator access
  const { serverlessSuccess, containerSuccess } = await testDirectValidators();
  
  // Test NestJS integration
  let nestJsSuccess = false;
  try {
    nestJsSuccess = await testNestJsIntegration();
  } catch (error) {
    console.error('Error testing NestJS integration:', error);
  }
  
  console.log('\n=== Test Summary ===');
  console.log(`Direct Serverless Validator: ${serverlessSuccess ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Direct Container Validator: ${containerSuccess ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`NestJS Integration: ${nestJsSuccess ? '✅ WORKING' : '❌ FAILED'}`);
  
  if (!serverlessSuccess && !containerSuccess) {
    console.log('\n❌ CRITICAL ERROR: Both validators are not working directly!');
    console.log('Please check your deployment and configuration.');
  } else if (!nestJsSuccess) {
    console.log('\n❌ ERROR: NestJS integration is not working!');
    console.log('Please check your NestJS configuration and service implementation.');
  } else if (serverlessSuccess && containerSuccess && nestJsSuccess) {
    console.log('\n✅ SUCCESS: Technical SEO Validator is fully integrated and working!');
    console.log('The system is using the dual validator approach:');
    console.log('- Serverless validator for HTML content (faster, lightweight)');
    console.log('- Container validator for URL validation (with Puppeteer support)');
  } else {
    console.log('\n⚠️ PARTIAL SUCCESS: Some components are working, but not all.');
    console.log('Please check the specific errors above and fix the failing components.');
  }
}

runTests().catch(console.error);
