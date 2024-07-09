require("module-alias-jest/register");
const MatthewClient = require("@client");
const config = require("@config/config.json");
const userBots = require("@config/userBots.json");
const { l } = require("@root/emojiCharacters");
const client = new MatthewClient(config, true);
const UserBot = require("@userBot");

const BOT_COUNT = 2;

(async () => {
  client.login();

  await new Promise((resolve, reject) => {
    client.once("error", reject);
    client.once("ready", () => {
      client.off("error", reject);
      resolve();
    });
  });

  client.testGuild = await client.guilds.fetch(config["guildId"]);

  let channels = await client.testGuild.channels.fetch();

  for (var channel of channels) {
    if (channel[1].name == "testing-channel") await channel[1].delete();
  }

  client.testChannel = await client.testGuild.channels.fetch(
    "720351714791915523"
  );

  let bots = [];
  for (var i = 0; i < BOT_COUNT; i++) {
    bots.push(new UserBot())
    await bots[i].login(
      userBots["bots"][i]["username"],
      userBots["bots"][i]["password"]
    );
    
    bots[i].user = await client.testGuild.members.fetch(bots[i].userId);
    bots[i].guildId = config["guildId"];
    bots[i].channelId = client.testChannel.id;
  }

  

  await bots[0].sendCommand("testgame", "MatthewBot2");

    response = await client.waitForMessage({
      embeds: [
        {data: {title: "game game created!  [1/4]"}}],
      components: [{ components: [{},{},{}] }],
    });

    await bots[1].clickButton("Join / Leave", response)

    response = await client.waitForMessage({
      embeds: [
        {data: {title: "game game created!  [2/4]"}}],
      components: true,
    });

})();
