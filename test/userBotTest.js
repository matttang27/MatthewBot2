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
    client.testChannel = await client.testGuild.channels.fetch("720351714791915523");

    
    const bot1 = new UserBot();
    bot1.guildId = client.testGuild.id;
    bot1.channelId = client.testChannel.id;

    
    await bot1.login("matttangclone5@gmail.com", "matthewtestingbot");
    await bot1.sendCommand("mocktest", "MatthewBot2");
    await new Promise(r => setTimeout(r, 5000));
    
    let messages = await client.testChannel.messages.fetch({limit: 1});

    await bot1.clickButton("Test",messages.at(0).id);
    


    

    



    //let messages = await client.testChannel.messages.fetch({limit: 5});
    //console.log(messages[2].content);
})();
