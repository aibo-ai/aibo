require('dotenv').config();

console.log('🔍 Environment Variables Check:\n');

const azureKeys = [
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_OPENAI_KEY', 
  'AZURE_OPENAI_DEPLOYMENT_NAME',
  'AZURE_OPENAI_API_VERSION',
  'COSMOS_DB_ENDPOINT',
  'COSMOS_DB_KEY',
  'COSMOS_DB_DATABASE_NAME',
  'AZURE_SEARCH_ENDPOINT',
  'AZURE_SEARCH_KEY',
  'NEWS_API_KEY',
  'SERP_API_KEY',
  'EXA_API_KEY',
  'MEDIASTACK_API_KEY'
];

azureKeys.forEach(key => {
  const value = process.env[key];
  console.log(`${key}: ${value ? `${value.substring(0, 20)}...` : '❌ NOT SET'}`);
});

console.log('\n📊 Summary:');
const setKeys = azureKeys.filter(key => process.env[key]);
console.log(`✅ Set: ${setKeys.length}/${azureKeys.length} keys`);
console.log(`❌ Missing: ${azureKeys.length - setKeys.length} keys`);

if (setKeys.length < azureKeys.length) {
  console.log('\n🚨 Missing keys:');
  azureKeys.filter(key => !process.env[key]).forEach(key => {
    console.log(`  - ${key}`);
  });
}
