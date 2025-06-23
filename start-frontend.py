#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys
from pathlib import Path

PORT = 3001
BUILD_DIR = Path(__file__).parent / "client" / "build"

print(f"🚀 Starting Product X Frontend Server...")
print(f"📁 Build directory: {BUILD_DIR}")
print(f"📂 Directory exists: {BUILD_DIR.exists()}")

if not BUILD_DIR.exists():
    print(f"❌ Build directory not found: {BUILD_DIR}")
    sys.exit(1)

# Change to build directory
os.chdir(BUILD_DIR)
print(f"📍 Changed to directory: {os.getcwd()}")

class ProductXHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_GET(self):
        # Log requests
        print(f"📥 {self.command} {self.path}")
        
        # For SPA routing, serve index.html for non-file requests
        if not os.path.exists(self.path.lstrip('/')) and not '.' in self.path:
            self.path = '/index.html'
        
        return super().do_GET()
    
    def log_message(self, format, *args):
        # Custom logging
        print(f"🌐 {format % args}")

try:
    with socketserver.TCPServer(("", PORT), ProductXHandler) as httpd:
        print(f"🚀 Product X Frontend running on http://localhost:{PORT}")
        print(f"🔗 Open in browser: http://localhost:{PORT}")
        print(f"📊 Product X Dashboard: Look for 'Product X - Sleep Company' in sidebar")
        print(f"🛑 Press Ctrl+C to stop")
        httpd.serve_forever()
except KeyboardInterrupt:
    print(f"\n🛑 Shutting down frontend server...")
except Exception as e:
    print(f"❌ Error starting server: {e}")
    sys.exit(1)
