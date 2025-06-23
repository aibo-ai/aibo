const http = require('http');

console.log('🧪 Testing connection to backend...');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`✅ Response status: ${res.statusCode}`);
  console.log(`📋 Response headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Response body:', data);
    console.log('🎉 Connection test completed successfully!');
  });
});

req.on('error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.error('🔍 Error details:', error);
});

req.on('timeout', () => {
  console.error('⏰ Request timeout');
  req.destroy();
});

req.setTimeout(5000);
req.end();

console.log('📡 Request sent to http://localhost:3002/health');
