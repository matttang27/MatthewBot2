const setupTestEnvironment = require('@root/test/jestSetup')
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
}, 10000)

afterEach(() => {
    jest.clearAllMocks();
});

describe('mocktest command: ', () => {
    it("should take in a button and command interaction as input", async () => {
        let interaction = testClient.sendCommand(testClient.members[0],"mocktest",[]);

        while(messageFunctions.editReply.mock.calls.length == 0) {
            await new Promise(r => setTimeout(r, 100));
        }

        console.log(interaction)
        let g = await client.guilds.fetch("720351714791915520")
        let c = await g.channels.fetch("720351714791915523")
        let m = await c.messages.fetch({ limit: 10, cache: false })
        await new Promise(r => setTimeout(r, 2000));
        console.log(m);
        expect(messageFunctions.editReply).toHaveBeenCalled()
        

        
    }, 1000000)
})

