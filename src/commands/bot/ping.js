const { prefix, token } = require(require.resolve("@root/config.json"));
module.exports = {
	args: [0],
	name: "ping",
	category: "bot",
	aliases: ["pong", "latency", "lag"],
	description: "Ping me!",
	usage: `${prefix}ping`,
	perms: [],
	execute(message, args, other) {
		var ping = Date.now() - message.createdAt;
		if (other["commandName"] == "ping") {
			var added = ":ping_pong: Pong! ";
		} else if (other["commandName"] == "pong") {
			var added = ":ping_pong: Ping! ";
		} else {
			var added = "Ping: ";
		}
		message.channel.send(added + `\`${ping}ms\``);
	},
};

function msToTime(ms) {
	days = Math.floor(ms / 86400000);
	daysms = ms % 86400000;;
	hours = Math.floor(daysms / 3600000);;
	hoursms = ms % 3600000;
	minutes = Math.floor(hoursms / 60000);;
	minutesms = ms % 60000;
	sec = Math.floor(minutesms / 1000);
	let str = "";
	if (days) str = str + days + "d";
	if (hours) str = str + hours + "h";
	if (minutes) str = str + minutes + "m";
	if (sec) str = str + sec + "s";
	return str;
}