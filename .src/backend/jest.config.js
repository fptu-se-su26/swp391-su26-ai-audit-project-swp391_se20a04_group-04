module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'tests/coverage',
  coverageReporters: ['html', ['text', { maxCols: 1000 }], 'text-summary', 'clover'],
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
