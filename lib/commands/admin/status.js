"use strict";

const Clapp = require("../../modules/clapp-discord");

module.exports = new Clapp.Command({
	name: "status",
	desc: "Gets information about the Discord bot and Steam bots sent to you on a DM",
	fn: (argv, context) => {
		return new Promise((fulfill, reject) => {
			let bots = context.dotaHandler.bots;

			let msg = "Hello! Here's the bot status information:\n\n";

			let genValueString = (key, value, newline = true) => {
				return `- **${key}**: \`${value}\`${newline ? "\n" : ""}`;
			};

			msg += genValueString("Uptime", context.summaryHandler.bot.uptime);

			for (let i = 0; i < bots.length; i++) {
				let bot = bots[i];

				msg += genValueString(
					`Bot #${bot.id}`,
					context.dotaHandler.isBotInLobby(bot.id)
						? `In lobby: ${bot.currentLobby.name} (Event #${bot.currentLobby.event.id})`
						: `Not in lobby`,
						i === bots.length
				);
			}

			context.msg.author.sendMessage(msg)
				.then(() => fulfill("The information you requested was sent to you in a DM."))
				.catch(reject);
		});
	},
	args: [
		require("./shared/event")
	]
});