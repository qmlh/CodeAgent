const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Multi-Agent IDE...');

// Start webpack dev server
console.log('Starting webpack dev server...');
const webpackProcess = spawn('npm', ['run', 'dev:renderer'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' }
});

// Wait for webpack to start, then start Electron
setTimeout(() => {
  console.log('Starting Electron...');
  const electronProcess = spawn('npx', ['electron', path.join(__dirname, 'test-main.js')], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1', NODE_ENV: 'development' }
  });

  electronProcess.on('close', () => {
    console.log('Electron closed, stopping webpack...');
    webpackProcess.kill();
    process.exit(0);
  });
}, 5000); // Wait 5 seconds for webpack to start

// Handle cleanup
process.on('SIGINT', () => {
  console.log('Shutting down...');
  webpackProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  webpackProcess.kill();
  process.exit(0);
});