const setupTestEnvironment = require('@root/test/jestSetup')
const MatthewClient = require('@client');
const TestClient = require('@testClient');

/** @type {MatthewClient} */
let client;
/** @type {TestClient} */
let testClient;

let messageFunctions = {
    edit: console.log,
    deferReply: console.log,
    reply: console.log,
    editReply: console.log
  }

[client, testClient] = await setupTestEnvironment(messageFunctions);

