require('module-alias-jest/register')
const MatthewClient = require('@client');
const config = require('@config');
const client = new MatthewClient(config,true);
client.login();

