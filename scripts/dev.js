/**
 * Development script for Electron app
 */

const { spawn } = require('child_process');
const path = require('path');

// Set UTF-8 encoding for Windows
if (process.platform === 'win32') {
  process.env.CHCP = '65001';
}

// Start webpack dev server for renderer
const rendererProcess = spawn('npm', ['run', 'dev:renderer'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' }
});

// Wait a bit for the dev server to start, then start Electron
setTimeout(() => {
  const electronProcess = spawn('npx', ['electron', path.join(__dirname, '../dist/main.js')], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1', NODE_ENV: 'development' }
  });

  electronProcess.on('close', () => {
    rendererProcess.kill();
    process.exit(0);
  });
}, 3000);

// Handle cleanup
process.on('SIGINT', () => {
  rendererProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  rendererProcess.kill();
  process.exit(0);
});