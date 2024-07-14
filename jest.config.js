const aliases = require('module-alias-jest/register')

module.exports = {
  moduleNameMapper: aliases.jest,
  testTimeout: 100_000
}