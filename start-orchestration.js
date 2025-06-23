#!/usr/bin/env node

/**
 * Quick Start Script for Content Architect Orchestration
 * This script starts the NestJS backend with minimal configuration
 * to test the orchestration layer integration
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Content Architect Orchestration System...\n');

// Start NestJS backend with TypeScript compilation disabled for speed
console.log('📊 Step 1: Starting NestJS Backend (Port 3000)...');
const nestProcess = spawn('npx', ['nest', 'start', '--watch', '--preserveWatchOutput'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    TS_NODE_TRANSPILE_ONLY: 'true', // Skip type checking for faster startup
    TS_NODE_TYPE_CHECK: 'false'
  }
});

// Handle process cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down orchestration system...');
  nestProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down orchestration system...');
  nestProcess.kill('SIGTERM');
  process.exit(0);
});

nestProcess.on('close', (code) => {
  console.log(`\n📊 NestJS backend exited with code ${code}`);
  process.exit(code);
});

console.log(`
🎯 Content Architect Orchestration System Starting...

📊 Backend API: http://localhost:3000
📚 API Documentation: http://localhost:3000/api
🔍 Health Check: http://localhost:3000/health

🏗️ Architecture Layers:
  • Bottom Layer: /bottom-layer/* (Query Intent, Freshness, Keywords)
  • Middle Layer: /middle-layer/* (BLUF, Conversational, Semantic)
  • Top Layer: /top-layer/* (E-E-A-T, Research, Citations)

🚀 To test orchestration:
  1. Wait for "Nest application successfully started" message
  2. In another terminal, run: node orchestrated-server.js
  3. Test at: http://localhost:3001

⚡ Quick Test Commands:
  curl http://localhost:3000/health
  curl -X POST http://localhost:3000/bottom-layer/analyze-intent -H "Content-Type: application/json" -d '{"topic":"AI Technology","audience":"b2b"}'
`);
