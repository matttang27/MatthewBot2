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
    bot1.guildId = config['guildId']
}, 100_000)

beforeEach(async () => {
    client.testChannel = await client.testGuild.channels.create({name: "testing-channel"});
    bot1.channelId = client.testChannel.id;
})

afterEach(async () => {
    await client.testChannel.delete();
})



describe('mocktest command', () => {
  it('command interaction, button, and message should work', async () => {

    await bot1.sendCommand("mocktest", "MatthewBot2");

    await new Promise(r => setTimeout(r, 5000));

    let messages = await client.testChannel.messages.fetch({limit: 1});
    expect(messages.at(0).author.id).toBe(client.user.id)

    await bot1.clickButton("Test", messages.at(0).id);
    await new Promise(r => setTimeout(r, 5000));

    messages = await client.testChannel.messages.fetch({limit: 1});
    expect(messages.at(0).author.id).toBe(client.user.id)
    expect(messages.at(0).content).toBe("type pls");

    await bot1.sendMessage("Hello")
    await new Promise(r => setTimeout(r, 5000));
    messages = await client.testChannel.messages.fetch({limit: 1});
    expect(messages.at(0).author.id).toBe(client.user.id)
    expect(messages.at(0).content).toBe("Hello");

    
  }, 1000_000);
});