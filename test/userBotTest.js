require("module-alias-jest/register");
const MatthewClient = require("@client");
const config = require("@config/config.json");
const userBots = require("@config/userBots.json");
const { l } = require("@root/emojiCharacters");
const client = new MatthewClient(config, true);
const UserBot = require("@userBot");

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
  client.testChannel = await client.testGuild.channels.fetch(
    "720351714791915523"
  );

  const bot1 = new UserBot();
  bot1.guildId = client.testGuild.id;
  bot1.channelId = client.testChannel.id;

  await bot1.login(
    userBots["bots"][0]["username"],
    userBots["bots"][0]["password"]
  );

  await bot1.sendCommand("testing", "MatthewBot2");

  let response = await client.waitForMessage({
    embeds: [{ description: "ephemeral message" }],
  });

  console.log(response);
  //let messages = await client.testChannel.messages.fetch({limit: 5});
  //console.log(messages[2].content);
})();
