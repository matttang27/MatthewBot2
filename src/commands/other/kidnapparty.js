const { prefix, token } = require(require.resolve("@root/config.json"));
const fs = require('fs');
const Discord = require('discord.js');

module.exports = {
	args: [1],
	name: "kidnapparty",
	description: "KIDNAPS PEOPLE EVERYWHEREE",
	usage: `${prefix}kidnapparty <times>`,
	perms: ["MOVE_MEMBERS"],
	async execute(message, args, other) {
		var admin = other["admin"]
		var bot = other["bot"]
		var commandName = other["commandName"]

		var org = {}
		var vcs = []
		var mbs = []
		message.guild.channels.cache.each(channel => {
			if (channel.type == "voice") {
				channel.members.each(u=>{
					org[u.id] = channel.id
					mbs.push(u)
				})
				vcs.push(channel.id)
			}
		})
		var counter = 0
		var timer = setInterval(()=>{
			for (u of mbs) {
				
				u.voice.setChannel(vcs[Math.floor(Math.random()*vcs.length)])
			}
			counter++
			if (counter == args[0]) {
				clearInterval(timer)
			}
		},5000)
		console.log(org)
		setTimeout(()=>{
			for (u of mbs) {
				u.voice.setChannel(org[u.id])
			}
		},5000*args[0]+5000)


		
	}
};	

