module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
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
