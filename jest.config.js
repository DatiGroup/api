/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = { 
  globalSetup: '<rootDir>/jest.global-setup.js',
    // Run tests serially to avoid race conditions with global setup
   // maxWorkers: 1,
  testEnvironment: "node",
  transform: {
    "^.+\.tsx?$": ["ts-jest", {
      // ts-jest configuration options
    }],
  },
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    "/node_modules/"
  ],

  // Set test timeout higher for integration tests
  testTimeout: 30000,

  // Setup files for test environment - runs for each test file
  setupFilesAfterEnv: ['<rootDir>/src/__test__/setup/jest.setup.ts'],

  // Test file patterns
  testMatch: ['**/__test__/**/*.test.ts'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Transform node_modules if needed
  transformIgnorePatterns: [
    'node_modules/(?!(@keycloak/keycloak-admin-client)/)'
  ],

  // Coverage collection patterns
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__test__/**/*'
  ],
  
};