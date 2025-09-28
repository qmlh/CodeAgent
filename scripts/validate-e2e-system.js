#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

async function validateE2ESystem() {
  console.log('🔍 Validating E2E Testing System...\n');

  try {
    // Check if required files exist
    const requiredFiles = [
      'src/tests/e2e/setup/TestEnvironment.ts',
      'src/tests/e2e/scenarios/CollaborationWorkflowTests.ts',
      'src/tests/e2e/scenarios/ConcurrentAgentTests.ts',
      'src/tests/e2e/performance/PerformanceBenchmarks.ts',
      'src/tests/e2e/reporting/TestReporter.ts',
      'src/tests/e2e/utils/TestAnalyzer.ts',
      'src/tests/e2e/jest.config.js',
      'src/tests/e2e/run-e2e-tests.ts'
    ];

    console.log('📁 Checking required files...');
    for (const file of requiredFiles) {
      try {
        await fs.access(file);
        console.log(`  ✅ ${file}`);
      } catch (error) {
        console.log(`  ❌ ${file} - Missing!`);
        throw new Error(`Required file missing: ${file}`);
      }
    }

    // Check TypeScript compilation
    console.log('\n🔨 Checking TypeScript compilation...');
    await runCommand('npx', ['tsc', '--noEmit', '--project', '.']);
    console.log('  ✅ TypeScript compilation successful');

    // Run validation tests
    console.log('\n🧪 Running E2E system validation tests...');
    await runCommand('npx', [
      'jest',
      'src/tests/e2e/validation/E2ESystemValidation.test.ts',
      '--testTimeout=120000',
      '--verbose'
    ]);
    console.log('  ✅ Validation tests passed');

    // Test CLI runner
    console.log('\n🚀 Testing E2E CLI runner...');
    await runCommand('npx', [
      'ts-node',
      'src/tests/e2e/run-e2e-tests.ts',
      '--help'
    ]);
    console.log('  ✅ CLI runner working');

    console.log('\n🎉 E2E Testing System Validation Complete!');
    console.log('\n📋 Available Commands:');
    console.log('  npm run test:e2e                    # Run all E2E tests');
    console.log('  npm run test:e2e:collaboration      # Run collaboration tests');
    console.log('  npm run test:e2e:concurrent         # Run concurrent tests');
    console.log('  npm run test:e2e:performance        # Run performance benchmarks');
    console.log('  npm run test:e2e:verbose            # Run with verbose output');
    console.log('  npm run test:e2e:update-baseline    # Update performance baseline');
    console.log('\n📊 Reports will be generated in: ./test-reports/e2e/');

  } catch (error) {
    console.error('\n❌ E2E System Validation Failed:', error.message);
    process.exit(1);
  }
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(' ')}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateE2ESystem();
}

module.exports = { validateE2ESystem };