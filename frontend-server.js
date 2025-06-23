const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const BUILD_DIR = path.join(__dirname, 'client', 'build');

console.log('Starting frontend server...');
console.log('Build directory:', BUILD_DIR);
console.log('Directory exists:', fs.existsSync(BUILD_DIR));

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let filePath;
  
  if (req.url === '/') {
    filePath = path.join(BUILD_DIR, 'index.html');
  } else {
    filePath = path.join(BUILD_DIR, req.url);
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // File doesn't exist or is not a file, serve index.html for SPA routing
      filePath = path.join(BUILD_DIR, 'index.html');
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        console.error('Error reading file:', err);
        res.writeHead(500);
        res.end(`Server Error: ${err.message}`);
        return;
      }

      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Frontend server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${BUILD_DIR}`);
  console.log(`🔗 Open in browser: http://localhost:${PORT}`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.log(`⚠️ Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    server.listen(PORT + 1, '127.0.0.1');
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down frontend server...');
  server.close(() => {
    console.log('✅ Frontend server stopped');
    process.exit(0);
  });
});
