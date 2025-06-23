const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const BUILD_DIR = path.join(__dirname, 'client', 'build');

console.log('🚀 Starting Product X Frontend Server...');
console.log('📁 Build directory:', BUILD_DIR);
console.log('📂 Directory exists:', fs.existsSync(BUILD_DIR));

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  console.log(`📥 ${req.method} ${req.url}`);

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

  // For SPA routing, serve index.html for non-file requests
  if (!fs.existsSync(filePath) && !path.extname(req.url)) {
    filePath = path.join(BUILD_DIR, 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found, serve index.html for SPA routing
        fs.readFile(path.join(BUILD_DIR, 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end(`Server Error: ${err.code}`);
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Product X Frontend running on http://localhost:${PORT}`);
  console.log(`🔗 Open in browser: http://localhost:${PORT}`);
  console.log(`📊 Product X Dashboard: Look for 'Product X - Sleep Company' in sidebar`);
});

server.on('error', (error) => {
  console.error('❌ Frontend server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.log(`⚠️ Port ${PORT} is already in use.`);
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down frontend server...');
  server.close(() => {
    console.log('✅ Frontend server stopped');
    process.exit(0);
  });
});
