const { prefix, ownerID } = require(require.resolve("@root/config.json"));
const fs = require('fs');
const Discord = require('discord.js');

module.exports = {
	args: [-1],
	name: "emojiadd",
	aliases: ["ea"],
	description: "Creates an emoji with a link and name",
	usage: `${prefix}emojiadd <imageurl> <name>`,
	perms: [0x0040000000],
	async execute(message, args, other) {
		var admin = other["admin"]
		var bot = other["bot"]
		var commandName = other["commandName"]
		message.guild.emojis.create(args[0],args[1]).then(emoji => message.channel.send(`Created new emoji with name ${emoji.name}`)).catch(err => message.channel.send(new Discord.MessageEmbed().setTitle("Emoji Add Failed").setDescription("Error Message:\n\n" + err).setColor("#FF0000")))
		
	}
};	

