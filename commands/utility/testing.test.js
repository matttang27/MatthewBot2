require('module-alias-jest/register')
const MatthewClient = require('@client');
const config = require('@config/config.json');
const userBots = require('@config/userBots.json');
const client = new MatthewClient(config,true);


const UserBot = require('@userBot');
const { Events } = require('discord.js');

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
    await bot1.login(userBots["bots"][0]["username"], userBots["bots"][0]["password"]);
    bot1.guildId = config['guildId']
}, 100_000)

beforeEach(async () => {
    client.testChannel = await client.testGuild.channels.create({name: "testing-channel"});
    bot1.channelId = client.testChannel.id;
})

afterEach(async () => {
    await client.testChannel.delete();
})



describe('testing command', () => {
  it('should reply with an ephemeral message', async () => {

    await bot1.sendCommand("testing", "MatthewBot2");

    let response = await client.waitForMessage({"embeds": [{"data": {"description":"ephemeral message"}}]})
    
    expect(response.embeds[0].description).toBe("ephemeral message");


    
  }, 1000_000);
});