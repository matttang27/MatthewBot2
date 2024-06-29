require('module-alias-jest/register')
const MatthewClient = require('@client');
const config = require('@config');
const client = new MatthewClient(config,true);


const UserBot = require('@userBot');

beforeAll(async () => {
    client.login();


    await new Promise((resolve, reject) => {
        client.once("error", reject);
        client.once("ready", () => {
            client.off("error", reject);
            resolve();
        });
    });

    client.testGuild = await client.guilds.fetch(config['guildId']);
    bot1 = new UserBot();
    await bot1.login("matttangclone5@gmail.com", "matthewtestingbot");
}, 100_000)

beforeEach(async () => {
    client.testChannel = await client.testGuild.channels.create({name: "testing-channel"});
})

afterEach(async () => {
    //await client.testChannel.delete();
})

describe('ping command', () => {
  it('should reply with Pong!', async () => {

    await bot1.sendCommand("ping", "MatthewBot2", client.testGuild.id, client.testChannel.id);

    await new Promise(r => setTimeout(r, 5000));

    let messages = await client.testChannel.messages.fetch({limit: 1});
    expect(messages.at(0).content).toBe("Pong!")


    
  }, 1000_000);
});