/**
 * update routes
 */
// modules
const fs = require("fs");
const httpz = require("@octanuary/httpz");
const path = require("path");
const https = require("https");
const http = require("http");
const folder = path.join(__dirname, "../../wrapper/controllers");
// stuff
const database = require("../../data/database"), DB = new database(true);
const {
	WRAPPER_VER: version
} = process.env;

// create the group
const group = new httpz.Group();

group
	// updates
	.route("GET", "/api/updateAPI/", async (req, res) => {
		//Variatables
		let controllers = ["app", "asset", "char", "movie", "theme", "tts"];
		//Does it need the server folder to insert new server stuff? (comedy world)
		let serverUpdate = false;
		//Only update the controllers
		let updateControls = false;
		//Only update the models
		let updateModels = false;
		//Only update html
		let updateHtml = false;
		//If the database js and json need to be modified
		let isToughUpdating = false;
		//If it needs to update its own
		let updateOwnScript = false;
		//Do we need to do more metainfo?
		let isNewVersion = false;
		//Stages: Alpha,Beta,etc
		let stage = "beta testers";
		//Everything else has to be disabled for this. (this will update the wrapper folder)
		let bugFixesOnly = false;
		//get the update settings
		https.get(
			{
				hostname: "updates.wrapperclassic.net",
				path: `/updatepermissions.json`
			},
			(r) => {
				let body = "";
				r.on("data", (b) => body += b);
				r.on("end", () => {
					const json = JSON.parse(body);
					console.log(json);
					const { isServerUpdate, onlyUpdateControls, onlyUpdateModels, OnlyUpdateHTML, toughUpdate, UpdateTheScript, newVersion, stageType, onlyBugFixes } = json;
					serverUpdate = isServerUpdate;
					updateControls = onlyUpdateControls;
					updateModels = onlyUpdateModels;
					updateHtml = OnlyUpdateHTML;
					isToughUpdating = toughUpdate;
					updateOwnScript = UpdateTheScript;
					isNewVersion = newVersion;
					stage = stageType;
					bugFixesOnly = onlyUpdateControls;
				});
			}
		)
		let poop = 0;
		console.log("my version: " + version.slice(0, -6));
		//Check of the version is different
		https.get(
			{
				hostname: "updates.wrapperclassic.net",
				path: `/version.txt`
			},
			(r) => {
				let body = "";
				r.on("data", (b) => body += b);
				r.on("end", () => {
					console.log(body.substring(0, 4));
					if (body.substring(0, 4) == version.slice(0, -6)) {
						poop = 2;
						console.log("The 2 is the test");
					}
				});
			}
		)
		//Delay function to await a request (version)

		setTimeout(function () {
			//Get the file(s) and overwrite the OGs with the new ones
			console.log("did it work");
			if (poop != 2) {
				try {
					for (let i = 0; i < controllers.length; i++) {
						http.get(
							{
								hostname: "updates.wrapperclassic.net",
								path: `/wrapper/controllers/${controllers[i]}.js`
							},
							(r) => {
								let body = "";
								r.on("data", (b) => body += b);
								r.on("end", () => {
									fs.writeFileSync(path.join(folder, `${controllers[i]}.js`), body);
								});
							}
						)
					}
				} catch (e) {
					console.log(e);
					poop = 3;
					throw new Error("Update failed!!!!!! Youre in a read only system!!!!!!");
				}
			}
			console.log(poop);
			if (poop == 0) {
				res.end("0successful");
				//Restarts the server? I dont know i pulled this from the internet
				setTimeout(function () {
					process.on("exit", function () {
						require("child_process").spawn(process.argv.shift(), process.argv, {
							cwd: process.cwd(),
							detached: true,
							stdio: "inherit"
						});
					});
					process.exit();
				}, 1000);
			}
			else if (poop == 1) {
				res.end("1poopfail");
			}
			else if (poop == 3) {
				res.end("3writefailed");
			}
			else {
				res.statusCode = "202";
				res.end("2nothingtodo");
			}
		}, 1000)
	});

module.exports = group;
