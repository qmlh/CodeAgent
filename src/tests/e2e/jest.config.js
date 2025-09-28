module.exports = {
  displayName: 'E2E Tests',
  testMatch: ['<rootDir>/src/tests/e2e/**/*.test.ts'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/e2e/setup/jest.setup.ts'],
  testTimeout: 300000, // 5 minutes for E2E tests
  maxWorkers: 1, // Run E2E tests sequentially to avoid conflicts
  verbose: true,
  collectCoverage: false, // Disable coverage for E2E tests
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  roots: ['<rootDir>/src/tests/e2e'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true
        }
      }
    }
  },
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-reports/e2e',
      filename: 'e2e-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'Multi-Agent IDE E2E Test Report'
    }],
    ['jest-junit', {
      outputDirectory: './test-reports/e2e',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ]
};