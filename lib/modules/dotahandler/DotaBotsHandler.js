const DotaHandler = require("./index");

// TODO remove this and move it to index.js

/**
 * @class DotaBotsHandler
 *
 * This class manages dota bots, and interacts with the DotaHandler.
 *
 * @property {DotaClientX[]} clients
 */
class DotaBotsHandler {

	/**
	 * @param {SteamBot[]} bots
	 */
	constructor(bots) {
		this.clients = bots.map(e => e.dota.client);

		// Convert the client object from Dota2Client to DotaClientX and subscribe to the
		// practiceLobbyUpdate event
		this.clients.forEach(client => {
			client.currentLobby = {};

			client.currentLobby.name = null;
			client.currentLobby.password = null;
			client.currentLobby.chatChannel = null;
			client.currentLobby.starting = false;
			client.currentLobby.enoughPeople = false;

			client.on("practiceLobbyUpdate", lobby => {
				this.currentLobby.chatChannel = "Lobby_" + lobby.lobby_id;

				let people = lobby.members.filter(e => {
					// e.team: 0 - Radiant
					//         1 - Dire
					//         2 - Casters    |
					//         3 - Coaches    |-> Filter out these
					//         4 - Unassigned |
					return e.team === 0 || e.team === 1
				}).length;

				if (!client.currentLobby.starting) {
					// TODO this.sendMessageToLobby(DotaHandler.generateStatusMessage(people));
				}

				client.currentLobby.enoughPeople = (people >= 10);
				if (client.currentLobby.enoughPeople && !client.currentLobby.starting) {
					// TODO this.start();
				}
			});
		});
	}

	/**
	 * Returns any bot that is not in a lobby, or null if all bots are full.
	 *
	 * @returns {DotaClientX|null}
	 */
	getAvailableBot() {
		this.clients.forEach(client => {
			if (!client.currentLobby) {
				return client;
			}
		});

		return null;
	}
}

module.exports = DotaBotsHandler;