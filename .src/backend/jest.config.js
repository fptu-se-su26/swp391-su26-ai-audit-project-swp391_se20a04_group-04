module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/**/*.js',
    'controllers/**/*.js',
    'server.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  clearMocks: true
};
