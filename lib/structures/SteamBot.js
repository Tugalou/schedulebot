const cfg    = require("../../config")
	, crypto = require("crypto")
	, db     = require("../modules/dbhandler").steambots
	, Dota2  = require("dota2")
	, Steam  = require("steam")
;

class SteamBot {

	constructor(id) {
		this.id = id;
		this.prefix = `[STEAM] [BOT #${id}]`;

		this.steam = {};
		this.dota = {};

		this.steam.client = new Steam.SteamClient();
		this.steam.user = new Steam.SteamUser(this.steam.client);
		this.steam.friends = new Steam.SteamFriends(this.steam.client);
		this.dota.client = new Dota2.Dota2Client(this.steam.client, false, false);

		this.steam.user.on("updateMachineAuth", (sentry, callback) => {
			let hashedSentry = crypto.createHash('sha1').update(sentry.bytes).digest();

			db.saveSentryFile(this.id, hashedSentry).then(() => {
				this._log("Saved new sentry file to the database.");
			}).catch(console.error);
			callback({ sha_file: hashedSentry });
		});

		this.steam.client.on("error", console.error);
	}

	/**
	 * Connects the current client to the steam network.
	 * @return {Promise}
	 */
	connectToSteam() {
		return new Promise((fulfill, reject) => {
			this.steam.client.on("connected", err => {
				if (!err) {
					this._log("Connected to the Steam network.");
					fulfill();
				} else {
					reject(err);
				}
			});

			this.steam.client.connect();
		});
	}

	/**
	 * Logs in Steam with the provided details.
	 * @param details
	 * @param {string} details.username The steam account's username
	 * @param {string} details.password The steam account's password
	 * @param {string} [details.steam_guard_code] If present, will log in with the Steam guard code.
	 * @param {Buffer} [details.sentry_file] If present, will log in with the sentry file.
	 * @return {Promise}
	 */
	logIn(details) {
		return new Promise((fulfill, reject) => {
			let logOnDetails = {};

			logOnDetails.account_name = details.username;
			logOnDetails.password = details.password;

			if (details.sentry_file) {
				logOnDetails.sha_sentryfile = details.sentry_file;
				this._log("Logging in with the database's sentry file...");
			}

			if (details.steam_guard_code) {
				logOnDetails.auth_code = details.steam_guard_code;
				db.deleteSteamGuardCode(this.id).then(() => {
					this._log("Steam Guard code was used, and therefore deleted from the database");
				});
			}

			this.steam.user.logOn(logOnDetails);
			console.log(logOnDetails)

			this.steam.client.on("logOnResponse", response => {
				if (response.eresult == Steam.EResult.OK) {
					this._log("Successfully logged in!");

					this.steam.friends.setPersonaState(Steam.EPersonaState.Online);
					this.steam.friends.setPersonaName(cfg.steam.name + ` #${this.id}`);
					this.steam.user.gamesPlayed([{
						game_id: 570
					}]); // Appear as playing Dota 2

					fulfill();
				} else {
					let err = new Error(this.prefix + " Login failed. Re-check your credentials.");
					err.steamResponse = response;
					reject(err); // TODO login fails
				}
			});
		});
	}

	/**
	 * @param {string} msg
	 * @private
	 */
	_log(msg) {
		console.log(this.prefix + " " + msg);
	}

}

module.exports = SteamBot;