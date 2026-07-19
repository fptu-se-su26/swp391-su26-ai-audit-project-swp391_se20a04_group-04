const fs = require('fs');
const path = require('path');

function getEnvironmentName() {
  return process.env.TEST_ENV || 'dev';
}

function readConfig() {
  const env = getEnvironmentName();
  const configPath = path.resolve(__dirname, '..', 'config', `${env}.json`);
  if (!fs.existsSync(configPath)) {
    throw new Error(`Không tìm thấy config cho môi trường: ${env}`);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

module.exports = { getEnvironmentName, readConfig };
