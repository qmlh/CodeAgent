#!/usr/bin/env node

/**
 * Development Start Script
 * Starts the Multi-Agent IDE in development mode with all features enabled
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Multi-Agent IDE Development Server...\n');

// Set environment variables for development
process.env.NODE_ENV = 'development';
process.env.ELECTRON_IS_DEV = '1';

// Start the development server
const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

devProcess.on('error', (error) => {
  console.error('❌ Failed to start development server:', error);
  process.exit(1);
});

devProcess.on('close', (code) => {
  console.log(`\n📊 Development server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  devProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down development server...');
  devProcess.kill('SIGTERM');
});

console.log('💡 Tips:');
console.log('   - The IDE will open with mock data pre-loaded');
console.log('   - Click "Open Project" to see the full IDE interface');
console.log('   - Use the sidebar panels to explore different features');
console.log('   - Check the Debug Panel in Welcome Screen for testing');
console.log('   - All UI components from Task 9 should be visible and functional\n');