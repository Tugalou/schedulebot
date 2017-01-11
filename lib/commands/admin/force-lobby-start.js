"use strict";

const Clapp            = require("../../modules/clapp-discord")
	, ECloseLobbyError = require("../../structures/enums/ECloseLobbyError")
	, db               = require("../../modules/dbhandler").events
;

module.exports = new Clapp.Command({
	name: "force-lobby-start",
	desc: "Forces the lobby for the specified event to start, even if there aren't enough players.",
	fn: (argv, context) => {
		return new Promise((fulfill, reject) => {
			db.events.get(argv.args.event).then(event => {
				if (event === null) {
					fulfill("Error: the specified event `" + argv.args.event + "` doesn't exist.");
				} else {
					db.events.getLobbyBotId(event)
						// Here, "closing" actually means "starting".
						.then(botID => context.dotaHandler.closeLobby(botID, true))
						.then(() => fulfill(`Forced lobby start for the event ${event.id}.`))
						.catch(err => {
							if (err.ECloseLobbyError) {
								switch (err.ECloseLobbyError) {
									case ECloseLobbyError.BOT_NOT_IN_LOBBY:
										fulfill(`The lobby for the event ${event.id} has not \n` +
										`been created yet.`);
										break;
								}
							} else {
								reject(err);
							}
						});
				}
			}).catch(reject);
		});
	},
	args: [
		require("./shared/event")
	]
});