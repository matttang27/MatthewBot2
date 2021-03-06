const { prefix, token, ownerID} = require(require.resolve("@root/config.json"));

module.exports = {
	args: [-1],
	name: "puppet",
	aliases: ["pp","say"],
	description: "Speak through TosBot!",
	usage: `${prefix}puppet <message>`,
	example: `${prefix}puppet HII!`,
	perms: ["MANAGE_MESSAGES"],
	
	execute(message, args, other) {

		var type = message.channel.type
		if (message.author.id != ownerID) {
			if (type == "GUILD_TEXT") {
				if (!message.member.roles.cache.find(r => r.name == "Puppeteer")) {
					return;
				}
			}
		
		}
		
		if (args.length == 0) {
			return message.reply("You need a message!")
		}
		message.delete()
		if (type == "GUILD_TEXT") {
			message.channel.send(args.join(' ')).catch(() => {
				message.channel.send("Message cannot be empty.")
			})
		}
		else {
			message.client.users.cache.get(message.author.id).send(args.join(' ')).catch(() => {
				if (type == "GUILD_TEXT") {
					message.channel.send("Message cannot be empty.")
				}
				else {
					message.client.users.cache.get(message.author.id).send("Message cannot be empty.")
				}
			})
		}
		if (type == "GUILD_TEXT") {
			console.log(`controlled by ${message.author.username} in ${message.channel.name} in ${message.guild.name}`)
		}
		else {
			console.log(`controlled by ${message.author.username} in DMs.`)
		}
		
	
	},
}