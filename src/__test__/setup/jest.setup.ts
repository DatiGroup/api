// Set test environment variables
process.env.NODE_ENV = 'test';
//process.env.LOG_LEVEL = 'silent'; // Disable logging during tests

// Mock environment variables that might be missing in test 
process.env.KEYCLOAK_CREATED_ENABLED_USERS = true.toString();
process.env.EMAIL_API_KEY = ''; //prevent email seding in tests

// Increase timeout for async operations
jest.setTimeout(30000);
