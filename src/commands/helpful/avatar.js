const { prefix, token } = require(require.resolve("@root/config.json"));
const fs = require('fs');
const Discord = require('discord.js');
const {findMember} = require(require.resolve("@functions"));

module.exports = {
	args: [0,1,2,3],
	name: "avatar",
	description: "Sends avatar",
	usage: `${prefix}avatar (user) (format) (size)`,
	perms: [],
	async execute(message, args, other) {
		var admin = other["admin"]
		var bot = other["bot"]
		var commandName = other["commandName"]
    let user;

    if (args.length == 0) {
      user = message.author
    }
    if (args.length == 1) {
      user = await findMember(message,args[0]);
    }
		if (args.length > 1) {
				if (["webp", "png", "jpg", "jpeg", "gif"].indexOf(args[1])== -1) {
				var embed = new Discord.MessageEmbed()
				.setColor("#FF0000")
				.setTitle("Avatar Image Format Fail")
				.setDescription(`"${args[1]}" is not one of the available image formats: webp, png, jpg, jpeg, gif`)
				return message.channel.send({ embeds: [embed]})
			}
		}
		if (args.length > 2) {
			if (['16', '32', '64', '128', '256', '512', '1024', '2048', '4096'].indexOf(args[2]) == -1) {
				var embed = new Discord.MessageEmbed()
				.setColor("#FF0000")
				.setTitle("Avatar Image Size Fail")
				.setDescription(`"${args[2]} is not one of the available image sizes: 16, 32, 64, 128, 256, 512, 1024, 2048, 4096`)
				return message.channel.send({ embeds: [embed]})
			}
		}
		
		
		
		message.channel.send(user.displayAvatarURL({format: args.length > 1 ? args[1] : "jpg",size: args.length == 2 ? args[2] : 1024}))

		
	}
};	

