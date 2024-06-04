const MatthewClient = require('./matthewClient');
const config = require('./config.json');
const client = new MatthewClient(config,true);
client.login();

