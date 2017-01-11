const ECreateLobbyError = require("../../structures/enums/ECreateLobbyError");

/**
 * @typedef {object} InhouseProps
 * @property {string} gameMode    See commands/general/add-inhouse for possible values.
 * @property {string} server      See commands/general/add-inhouse for possible values.
 * @property {string} autoBalance See commands/general/add-inhouse for possible values.
 */

/**
 * This class allows the rest of the app to interact with dota bots.
 *
 * @property {SteamBot[]} bots An array with all steam bots.
 */
class DotaHandler { // TODO !!!! make sure that all commands use the correct api of this

	/**
	 * @param {SteamBot[]} bots
	 */
	constructor (bots) {
		this.bots = bots;
	}

	/**
	 * Looks for an available bot and creates a lobby with the given properties.
	 * @param {InhouseProps} inhouseProps
	 * @returns {Promise<number>} Resolves with the id of the bot hosting the lobby.
	 *                            Rejects with an error. The handler must check whether or not the
	 *                            rejected error contains an ECreateLobbyError property, and handle
	 *                            those accordingly. If it doesn't, then the error is Steam or
	 *                            Dota's fault
	 */
	createLobby(inhouseProps) {
		return new Promise((fulfill, reject) => {
		    let client = this._getAvailableDotaClient();

		    if (client === null) {
		    	let err = new Error();
		    	err.ECreateLobbyError = ECreateLobbyError.NO_AVAILABLE_BOT;
		    	return reject(err);
			}

			client.createLobby(inhouseProps).then(() => {
		    	fulfill(client.botId);
			}).catch(reject);
		});
	}

	/**
	 * Invites an user to the bot's current lobby based on their Discord ID
	 *
	 * @param {number} botID The id of the bot hosting the lobby.
	 * @param {string} discordID The discord id of the user to invite.
	 * @return {Promise}
	 */
	invite(botID, discordID) {
		return new Promise((fulfill, reject) => {
			let client = this._getDotaClientById(botID);

			if (client === null) {
				reject(new Error(`The specified bot with ID ${botID} doesn't exist.`));
			} else {
				if (client.inLoby()) {
					client.invite(discordID).then(fulfill).catch(reject);
				} else {
					reject(new Error(`The bot with ID ${botID} is not in a lobby.`));
				}
			}
		});
	}

	/**
	 * @returns {DotaClientX|null} An available DotaClientX or null if none is available.
	 * @private
	 */
	_getAvailableDotaClient() {
		this.bots.forEach(bot => {
			if (!bot.dota.client.inLoby()) {
				return bot.dota.client;
			}
		});

		return null;
	}

	/**
	 * @param {number} id The SteamBot id.
	 * @returns {DotaClientX|null} The requested DotaClientX or null if it doesn't exist.
	 * @private
	 */
	_getDotaClientById(id) {
		return this.bots.find(el => el.id === id) || null;
	}
}

module.exports = DotaHandler;