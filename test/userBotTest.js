require('module-alias-jest/register')
const MatthewClient = require('@client');
const config = require('@config');
const client = new MatthewClient(config,true);
const UserBot = require('@userBot');

(async () => {
    client.login();


    await new Promise((resolve, reject) => {
        client.once("error", reject);
        client.once("ready", () => {
            client.off("error", reject);
            resolve();
        });
    });

    client.testGuild = await client.guilds.fetch(config['guildId']);

    /*
    const bot1 = new UserBot();
    await bot1.login("matttangclone5@gmail.com", "matthewtestingbot");

    await bot1.sendMessage("Testing","720351714791915520","720351714791915523")

    await bot1.sendCommand("ping","MatthewBot2","720351714791915520","720351714791915523");*/

    client.testChannel = await client.testGuild.channels.fetch("1256505336106582086");

    let messages = await client.testChannel.messages.fetch({limit: 5});
    console.log(messages[2].content);
})();
