/**
 * Update Technical SEO Validator Environment Variables
 * 
 * This script updates the environment configuration for the dual Technical SEO Validator setup.
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load existing .env file if it exists
const envPath = path.join(__dirname, '.env');
let envConfig = {};

try {
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envConfig = dotenv.parse(envFile);
    console.log('Loaded existing .env file');
  } else {
    console.log('No existing .env file found, creating a new one');
  }
} catch (error) {
  console.error('Error loading .env file:', error);
}

// Update Technical SEO Validator environment variables
envConfig.TECHNICAL_SEO_VALIDATOR_SERVERLESS_URL = 'https://ca-seo-validator.azurewebsites.net/api/validate';
envConfig.TECHNICAL_SEO_VALIDATOR_CONTAINER_URL = 'http://ca-seo-validator.eastus.azurecontainer.io:8080/api/validate';

// Prompt for function key if not set
if (!envConfig.TECHNICAL_SEO_VALIDATOR_SERVERLESS_KEY) {
  console.log('Please set TECHNICAL_SEO_VALIDATOR_SERVERLESS_KEY in your .env file');
  envConfig.TECHNICAL_SEO_VALIDATOR_SERVERLESS_KEY = 'your_function_key_here';
}

// Container API key is optional for now
if (!envConfig.TECHNICAL_SEO_VALIDATOR_CONTAINER_KEY) {
  envConfig.TECHNICAL_SEO_VALIDATOR_CONTAINER_KEY = '';
}

// Write updated config back to .env file
const envContent = Object.entries(envConfig)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('Updated .env file with Technical SEO Validator configuration');
  console.log('Technical SEO Validator URLs:');
  console.log(`- Serverless: ${envConfig.TECHNICAL_SEO_VALIDATOR_SERVERLESS_URL}`);
  console.log(`- Container: ${envConfig.TECHNICAL_SEO_VALIDATOR_CONTAINER_URL}`);
} catch (error) {
  console.error('Error writing .env file:', error);
}
