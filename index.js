require('module-alias-jest/register')
const MatthewClient = require('@client');
const config = require('@config/config.json');
const client = new MatthewClient(config,true);
client.login();

