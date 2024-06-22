const setupTestEnvironment = require('@root/test/jestSetup')
const MatthewClient = require('@client');
const TestClient = require('@testClient');

/** @type {MatthewClient} */
let client;
/** @type {TestClient} */
let testClient;

let messageFunctions = {
  edit: jest.fn(),
  deferReply: jest.fn(),
  reply: jest.fn(),
  editReply: jest.fn()
}

beforeAll(async () => {
  [client, testClient] = await setupTestEnvironment(messageFunctions);
})
afterEach(() => {
  jest.clearAllMocks();
});

describe('ping command', () => {
    it('should reply with Pong!', async () => {
      // Execute the command
      /** @type {[CommandInteraction, Promise<any>]} */
      let interaction = testClient.testingMessageSend(testClient.members[0],"ping",[]);
  
      
      while(messageFunctions.edit.mock.calls.length == 0) {
        await new Promise(r => setTimeout(r, 100));
      }
      expect(messageFunctions.edit).toHaveBeenCalledWith("Pong!");
      expect(messageFunctions.deferReply).toHaveBeenCalled();
      
    }, 1000_000);
  });