/**
 * Development script for Electron app
 */

const { spawn } = require('child_process');
const path = require('path');

// Start webpack dev server for renderer
const rendererProcess = spawn('npm', ['run', 'dev:renderer'], {
  stdio: 'inherit',
  shell: true
});

// Wait a bit for the dev server to start, then start Electron
setTimeout(() => {
  const electronProcess = spawn('electron', [path.join(__dirname, '../dist/main.js')], {
    stdio: 'inherit',
    shell: true
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