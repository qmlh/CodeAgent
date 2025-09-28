/**
 * Start development server with proper encoding
 */

const { spawn } = require('child_process');
const os = require('os');

// Force UTF-8 encoding
process.env.NODE_OPTIONS = '--max_old_space_size=4096';
process.env.FORCE_COLOR = '1';

if (os.platform() === 'win32') {
  // For Windows, set console code page to UTF-8
  console.log('Setting Windows console to UTF-8...');
  
  const setEncoding = spawn('cmd', ['/c', 'chcp 65001'], {
    stdio: 'pipe',
    shell: true
  });
  
  setEncoding.stdout.on('data', (data) => {
    console.log('Encoding set:', data.toString().trim());
  });
  
  setEncoding.on('close', () => {
    startDevelopment();
  });
  
  setEncoding.on('error', () => {
    console.log('Failed to set encoding, continuing anyway...');
    startDevelopment();
  });
} else {
  startDevelopment();
}

function startDevelopment() {
  console.log('Starting Multi-Agent IDE development server...');
  
  const devProcess = spawn('node', ['scripts/dev.js'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      FORCE_COLOR: '1',
      PYTHONIOENCODING: 'utf-8',
      LC_ALL: 'en_US.UTF-8',
      LANG: 'en_US.UTF-8'
    }
  });
  
  devProcess.on('close', (code) => {
    console.log(`Development server exited with code ${code}`);
    process.exit(code);
  });
  
  devProcess.on('error', (error) => {
    console.error('Failed to start development server:', error);
    process.exit(1);
  });
  
  // Handle cleanup
  process.on('SIGINT', () => {
    console.log('Shutting down development server...');
    devProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    devProcess.kill('SIGTERM');
  });
}