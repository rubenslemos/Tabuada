module.exports = {
  testMatch: ['<rootDir>/tests/**/*.integration.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/ui/'],
  setupFilesAfterEnv: ['<rootDir>/tests/backend/setup.js'],
}
