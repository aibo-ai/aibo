const fs = require('fs');
const path = require('path');

// Path to .env file
const envFilePath = path.join(__dirname, '.env');

// New environment variables to add
const newEnvVars = `
# Added Azure OpenAI Key (2024-07-19)
AZURE_OPENAI_KEY=7jyM5jIwKUBaEySW88oVpmhWXvl9WFkMQSxjkrGqWsjCHtb5qDHnJQQJ99BFAC77bzfXJ3w3AAAAACOGWt3u

# Added Azure Search Endpoint and Key (2024-07-19)
AZURE_SEARCH_ENDPOINT=https://aibo-search.search.windows.net/
AZURE_SEARCH_KEY=lqRymTRC0Z09GGCWUb5i8M81gfMjT087WJZgE0Wx7kAzSeC5yaYz

# Update OpenAI deployment name
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
`;

// Read the current .env file
fs.readFile(envFilePath, 'utf8', (err, data) => {
  if (err) {
    if (err.code === 'ENOENT') {
      // If .env doesn't exist, create it with the new variables
      fs.writeFile(envFilePath, newEnvVars, (err) => {
        if (err) {
          console.error('Error creating .env file:', err);
          return;
        }
        console.log('.env file created with new environment variables');
      });
    } else {
      console.error('Error reading .env file:', err);
    }
    return;
  }

  // Check if variables already exist
  const hasAzureOpenAIKey = data.includes('AZURE_OPENAI_KEY=');
  const hasAzureSearchEndpoint = data.includes('AZURE_SEARCH_ENDPOINT=');
  const hasAzureSearchKey = data.includes('AZURE_SEARCH_KEY=');
  
  // Update the deployment name if it exists
  let updatedData = data;
  if (data.includes('AZURE_OPENAI_DEPLOYMENT_NAME=')) {
    updatedData = updatedData.replace(
      /AZURE_OPENAI_DEPLOYMENT_NAME=.*/g, 
      'AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini'
    );
  }
  
  // Add missing variables
  let varsToAdd = '';
  if (!hasAzureOpenAIKey) {
    varsToAdd += '\n# Added Azure OpenAI Key (2024-07-19)\nAZURE_OPENAI_KEY=7jyM5jIwKUBaEySW88oVpmhWXvl9WFkMQSxjkrGqWsjCHtb5qDHnJQQJ99BFAC77bzfXJ3w3AAAAACOGWt3u\n';
  }
  if (!hasAzureSearchEndpoint) {
    varsToAdd += '\n# Added Azure Search Endpoint (2024-07-19)\nAZURE_SEARCH_ENDPOINT=https://aibo-search.search.windows.net/\n';
  }
  if (!hasAzureSearchKey) {
    varsToAdd += '\n# Added Azure Search Key (2024-07-19)\nAZURE_SEARCH_KEY=lqRymTRC0Z09GGCWUb5i8M81gfMjT087WJZgE0Wx7kAzSeC5yaYz\n';
  }
  
  // Write back to .env file
  if (varsToAdd || updatedData !== data) {
    fs.writeFile(envFilePath, updatedData + varsToAdd, (err) => {
      if (err) {
        console.error('Error updating .env file:', err);
        return;
      }
      console.log('.env file updated with new environment variables');
    });
  } else {
    console.log('All environment variables already exist in .env file');
  }
});
