const path = require('path');

module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/', '/__tests__/'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    '../../backend-hrmSOA/services/identity-service/src/**/*.js',
    '!../../backend-hrmSOA/services/identity-service/src/config/**',
    '!../../backend-hrmSOA/services/identity-service/server.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/setup.js'],
  // Add root directory to module resolution
  moduleDirectories: ['node_modules', path.resolve(__dirname, '../../..')],
  roots: ['<rootDir>'],
  // Map module paths
  moduleNameMapper: {
    '^../src/(.*)$': path.resolve(__dirname, '../../backend-hrmSOA/services/identity-service/src/$1')
  }
};

