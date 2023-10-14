/**
 * movie routes
 */
// modules
const ffmpeg = require("fluent-ffmpeg");
const httpz = require("@octanuary/httpz");
const https = require("https");
const http = require("http");
const rc4 = require("rc4-cipher");
const path = require("path");
const FormData = require("form-data");
const sfolder = path.join(__dirname, "../../", process.env.SAVED_FOLDER);
const afolder = path.join(__dirname, "../../", process.env.ASSET_FOLDER);
// stuff
const database = require("../../data/database"), DB = new database();
const Movie = require("../models/movie");
const Asset = require("../models/asset");
const fUtil = require("../../utils/fileUtil");
const fs = require("fs");
const { SWF_URL, STORE_URL, CLIENT_URL } = process.env;
const tempfile = require("tempfile");
const processVoice = require("../models/tts");
const rFileUtil = require("../../utils/realFileUtil");
let discord;
require("../../utils/discord")
	.then((f) => discord = f);
const info = require("../data/voices");
const movie = require("../models/movie");
const voices = info.voices, langs = {};
const folder = path.join(__dirname, "../../");
let timer;
let timer2;
let timer3;
let timer4;
let attempt = 0;
let offset = 0;
let boffset = 0;
let eoffset = 0;
let aoffset = 0;
let audio;
let offsetchanged = false;
let video;
let coffset;
let dur;
let exportmode = false;
let stage = false;
// create the group
const group = new httpz.Group();
function countdo() {
	aoffset += 0.1;
}
function waitForVideo() {
	for (var i = 0; i < Infinity; i++) {
		if (fs.existsSync(path.join("/Users/jaxsonhendrix", "output.mp3"))) {
			hectron = true;
			timer4 = setInterval(countdo, 100);
			break;
		}
		else {
			hectron = false;
		}
	}
}
function toAttrString(table) {
	return typeof (table) == "object" ? new URLSearchParams(table).toString() : table.replace(/"/g, "\\\"");
}
function toParamString(table) {
	return Object.keys(table).map(key =>
		`<param name="${key}" value="${toAttrString(table[key])}">`
	).join(" ");
}
function toObjectString(attrs, params) {
	return `<object id="obj" ${Object.keys(attrs).map(key =>
		`${key}="${attrs[key].replace(/"/g, "\\\"")}"`
	).join(" ")}>${toParamString(params)}</object>`;
}
function ch() {
	eoffset += 0.1;
	if (eoffset > dur + 1.75) {
		clearInterval(timer3);
		console.log("MOVIE IS FINISHED!!!!!!!! VIDEO AND AUDIO STOP NOW!!!!!");
		//Its going to say an error but it worked dont worry
		video.kill();
		audio.kill();
		timer3 = null;
	}
}
group
	// delete
	.route("GET", /\/api\/movie\/delete\/([^/]+)$/, async (req, res) => {
		const id = req.matches[1];

		console.log(`(Warning!) Deleting movie #${id}`);
		try {
			await Movie.delete(id);
			res.json({ status: "ok" });
		} catch (e) {
			console.error("This movie just won't die!", e);
			res.status(404);
			res.json({ status: "error" });
		}
	})
	.route("POST", "/goapi/tutaction/", async (req, res) => {
		res.setHeader("Content-Type", "application/xml");
		res.end(`0<?xml version="1.0" encoding="UTF-8"?>
		<points money="99" sharing="99"/>`);
	})
	// list
	.route("GET", "/api/movies/list", (req, res) => {
		res.json(DB.select("movies"));
	})
	.route("POST", "/site/topscored.rss", (req, res) => {
		res.end(`<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
		<channel>
		<title>
		<![CDATA[ Test ]]>
		</title>
		<description>
		<![CDATA[ I love tests, thx FT ]]>
		</description>
		<link>https://flashthemes.net/</link>
		<image>
		<url>http://localhost:4343/</url>
		<title>FT</title>
		<link>http://localhost:4343/</link>
		</image>
		<language>
		<![CDATA[ en-us ]]>
		</language>
		<ttl>60</ttl>

		<item>
		<title>
		<![CDATA[ Test ]]>
		</title>
		<description>
		<![CDATA[ <br/> <a href="http://localhost:4343/player?movieId=c03214b"> </a> <img src="/file/movie/thumb/c03214b.png" border="0"/> ]]>
		</description>
		<link>http://localhost:4343/player?movieId=c03214b</link>
		<guid isPermaLink="true">http://localhost:4343/player?movieId=c03214b</guid>
		<dc:creator>
		<![CDATA[ You ]]>
		</dc:creator>
		<pubDate>UNKNOWN</pubDate>
		<ga_info>
		<movieOwner>You</movieOwner>
		<title>Test of the ugc</title>
		<description/>
		<thumbnailURL>file/movie/thumb/c03214b</thumbnailURL>
		<duration>0:32</duration>
		<date/>
		<author>You</author>
		<movieId>c03214b</movieId>
		<movieOwnerId>393</movieOwnerId>
		<movieViews>1101</movieViews>
		</ga_info>
		</item>
		</channel>
		</rss>`);
	})
	.route("GET", "/get_video", (req, res) => {
		const movie = fs.readFileSync(path.join(folder, `videos/${req.query.video_id}.mp4`));
		res.end(movie);
	})
	.route("POST", "/log", (req, res) => {
		res.json({ redirect: "https://flashthemes.net" });
	})
	// load
	.route(
		"*",
		["/goapi/getMovie/", "/fbapi/getMovie/", /\/file\/movie\/file\/([^/]+)$/],
		async (req, res) => {
			exportmode = false;
			offset = 0;
			boffset = 0;
			eoffset = 0;
			aoffset = 0;
			let dur2 = 0;
			const isGet = req.method == "GET";
			let id
			if (!req.body.movieId) {
				id = isGet ?
					req.matches[1] :
					req.query.movieId;
			}
			else {
				id = req.body.movieId;
			}
			res.assert(id, 400, "");

			try {
				if (req.body.movieId != "qvm") {
					if (req.body.exportmode == "true") {
						exportmode = true;
						attempt = 0;
						const { exec } = require('child_process');
						//Delete the files and revert the stage for the command
						stage = false;
						exec('rm export.mpg', (err, stdout, stderr) => {
							if (err) {
								// node couldn't execute the command
								return;
							}

						});
						exec('rm output2.mp3', (err, stdout, stderr) => {
							if (err) {
								// node couldn't execute the command
								return;
							}

						});
						exec('rm export.mp4', (err, stdout, stderr) => {
							if (err) {
								// node couldn't execute the command
								return;
							}

						});
						exec('rm export2.mp4', (err, stdout, stderr) => {
							if (err) {
								// node couldn't execute the command
								return;
							}

						});
						exec('rm output.mp3', (err, stdout, stderr) => {
							if (err) {
								// node couldn't execute the command
								return;
							}

						});
						exec('rm exported.mp4', (err, stdout, stderr) => {
							if (err) {
								// node couldn't execute the command
								return;
							}

						});
						setTimeout(functionwise, 1000);
						function functionwise() {
							console.log("THIS SIDE!!!!");
							const folder = path.join(__dirname, "../../", process.env.SAVED_FOLDER);
							let filepath;
							let hectron = false;
							filepath = path.join(folder, `${id}.xml`);
							const buffer = fs.readFileSync(filepath).toString();
							var convert = require('xml-js');
							let result = convert.xml2json(buffer, { compact: true, spaces: 4 });
							const data = JSON.parse(result);
							dur = parseInt(data.film._attributes.duration);
							dur2 = parseInt(data.film._attributes.duration);
							timer = setInterval(change, 1000);
							function change() {
								offset++;
							}
							// ffmpeg parameter: -ss -0.25 (Actually nvm i manually trim)
							audio = exec(`/Applications/ffmpeg -async 30 -f avfoundation -i "none:0"  -ar 44100 output.mp3`, async (err, stdout, stderr) => {
							});
							video = exec(`/Applications/ffmpeg -async 30 -y -r 30 -f avfoundation -i "2:none" -vf "crop=2550:1380:190:355" export.mpg`, async (err, stdout, stderr) => {
								/*if (err) {
									// something happened with ffmpeg, load the movie anyway
									console.log(err);
									const buf = await Movie.load(id, isGet);
									res.setHeader("Content-Type", "application/zip");
									res.end(buf);
									return;
								}*/

								setTimeout(convet, 500);
							});
							/* The audio starting script is different
							* Also why is the function wait for VIDEO
							*/
							waitForVideo();
							//Recorder started
							for (var i = 0; i < Infinity; i++) {
								if (fs.existsSync(path.join("/Users/jaxsonhendrix", "export.mpg"))) {
									hectron = true;
									timer2 = setInterval(countdown, 100);
									break;
								}
								else {
									hectron = false;
								}
							}
							function countdown() {
								boffset += 0.1;
							}
						}
					}
					function convet() {
						const { exec } = require('child_process');
						let ty;
						http.get("http://localhost:4343/api/settings/list", (b) => {
							let body = "";
							b.on("data", (b) => body += b);
							b.on("end", () => {
								const json = JSON.parse(body);
								ty = json["OUTRO_TYPE"];
								actuallyConvert();
							})
						});
						function actuallyConvert() {
							exec(`/Applications/ffmpeg -async 30 -i export.mpg -i output.mp3 -f mp4 export.mp4 `, async (err, stdout, stderr) => {
								if (err) {
									console.log(err);
								}
								//console.log("million billion:",boffset);
								exec(`/Applications/ffmpeg -ss ${boffset + 1.2} -to ${(boffset + 1.2) + eoffset} -i export.mp4 -f mp4 export2.mp4`, async (err, stdout, stderr) => {
									if (err) {
										console.log(err);
									}
									if (ty != "nothing") {
										exec(`/Applications/ffmpeg -f concat -safe 0 -i fliles_${ty}.txt -c copy ${path.join(__dirname, "../../", "exported.mp4")}`, async (err, stdout, stderr) => {
											if (err) {
												console.log(err);
											}
										});
									}
									else {
										exec(`/Applications/ffmpeg -i export2.mp4 -c copy -f mp4 exported.mp4`, async (err, stdout, stderr) => {
											if (err) {
												console.log(err);
											}
										});
									}
								});
							});
						}

					}
					//Wait for the recorder to start
					setTimeout(async function () {
						const buf = await Movie.load(id, isGet);
						res.setHeader("Content-Type", "application/zip");
						res.end(buf);
					}, 1000);

				}
				else {
					const buf = await Movie.load(id, isGet);
					res.setHeader("Content-Type", "application/zip");
					res.end(buf);
				}
			} catch (e) {
				console.log("Error loading movie:", e);
				res.status(404);
				res.end();
			}
		}
	)
	.route("GET", "/api/movie/exportmovie", (req, res) => {
		return;
	})

	.route("GET", "/goapi/endMovieTimer/", (req, res) => {
		attempt++;
		if (exportmode) {
			clearInterval(timer);
			timer = null;
			clearInterval(timer2);
			timer2 = null;
			clearInterval(timer4);
			timer4 = null;
			console.log("Timer has ended, offset is:" + offset + ", The offset from the video recorder is: " + boffset + ", and the audio offset is: " + aoffset);
			res.end("GOOD");
			if (aoffset != boffset) {
				for (var i = 0; aoffset == boffset; i++) {
					aoffset -= 0.1;
					console.log(aoffset);
				}
			}
			timer3 = setInterval(ch, 100);
		}
		else {
			console.log("no bad");
			res.end("bad");
		}
	})
	.route("GET", "/api/saveqvmvideo/", (req, res) => {
		Movie.saveqvm();
		res.redirect("http://localhost:4343/");
	})
	.route("POST", "/ajax/saveText2Video", (req, res) => {
		Movie.saveqvm(req.body.title);
		res.json({ url: "http://localhost:4343/" });
	})
	.route("POST", "/api/movie/upload", (req, res) => {
		const file = req.files.import;
		if (!file) {
			console.log("Error uploading movie: No file.");
			res.statusCode = 400;
			return res.json({ msg: "No file" });
		}
		const isStarter = req.body.is_starter;
		const path = file.filepath, buffer = fs.readFileSync(path);

		if (
			file.mimetype !== "application/x-zip-compressed" &&
			file.mimetype !== "application/zip" &&
			!buffer.slice(0, 4).equals(
				Buffer.from([0x50, 0x4b, 0x03, 0x04])
			)
		) {
			console.error("Attempted movie upload with invalid file.");
			res.statusCode = 400;
			return res.json({ msg: "Movie is not a zip" });
		}

		Movie.upload(buffer, isStarter).then((id) => {
			fs.unlinkSync(path);
			res.json({ id: id });
		}).catch((err) => {
			console.error("Error uploading movie:", err);
			res.statusCode = 500;
			res.json({ msg: null });
		});
	})
	.route("POST", "/goapi/sendShareEmail/", (req, res) => {
		const handleError = (err) => {
			console.log("Error sending email:", err);
			res.statusCode = 500;
			res.end("1");
		};

		const request = https.request({
			hostname: "discord.com",
			path: "/api/v9/channels/1066856497637769371/messages",
			method: "POST",
			headers: {
				"Authorization": req.body.sender_email
			},
			payload: {
				"content": req.body.custom_message,
				"tts": false,
				"flags": 0
			}
		},
			(res) => {
				request.end();
			}).on("error", handleError);
	})
	// load
	.route(
		"*",
		["/goapi/getMovie/", /\/file\/movie\/file\/([^/]+)$/],
		async (req, res) => {
			const isGet = req.method == "GET";
			const id = isGet ?
				req.matches[1] :
				req.query.movieId;
			res.assert(id, 400, "");

			try {
				const buf = await Movie.load(id, isGet);
				res.setHeader("Content-Type", "application/zip");
				res.end(buf);
			} catch (e) {
				console.log("Error loading movie:", e);
				res.status(404);
				res.end();
			}
		}
	)
	// redirect
	.route("*", /\/videomaker\/full\/(\w+)\/tutorial$/, (req, res) => {
		const theme = req.matches[1];

		res.redirect(`/go_full?tray=${theme}&tutorial=0`);
	})

	// redirect
	.route("GET", "/dashboard/videos", (res) => {
		res.redirect(`/`);
	})
	.route("GET", "/go/studio", (res) => {
		res.redirect(`/go_full`);
	})
	.route("GET", /^\/go\/studio\/theme\/(\w+)$/, (req, res) => {
		res.redirect(`/old_full?v=2010&tray=${req.matches[1]}`);
	})
	// save
	//  #movies
	.route("POST", "/goapi/saveMovie/", async (req, res) => {
		if (req.body.userId != "") {
			res.assert(req.body.body_zip, 400, "1");
			const trigAutosave = req.body.is_triggered_by_autosave;
			res.assert(!(trigAutosave && !req.body.movieId), 200, "0");

			const body = Buffer.from(req.body.body_zip, "base64");
			const thumb = trigAutosave ?
				null : Buffer.from(req.body.thumbnail_large, "base64");

			const id = await Movie.save(body, thumb, req.body.movieId)
			res.end("0" + id);
		}
		else {
			rej("Cant Save Movie Due to not being logged in");
		}
	})
	.route("POST", "/goapi/clientbug/", async (req, res) => {
		const encryptedString = req.body.rpt;
		const decryptedString = rc4.decrypt(encryptedString, 'rc4@123');
		res.end("0OK");
	})

	.route("POST", "/ajax/previewText2Video", async (req, res) => {
		//HOLY SHIT REWRITING THIS WITH THE RIGHT RESPONSE
		discord("Generating a QVM");
		let qvm_theme = req.body.golite_theme;
		let expressions = [];
		let grrrrrr = [];
		let cam = [];
		let charorder = [];
		let charids = []
		let texts = [];
		let mcids = [];
		let template = "";
		let scriptscene = 0;
		let voicez = [];
		console.log(req.body);
		let f = req.body;
		console.log("test:", f);
		let has2chars = false;
		let focuschar = "";
		let isMicRecord = false;
		for (const data in f) { // characters & script timings
			if (data.includes(`enc_tid`)) template = f[data];
			if (data.includes(`script[1]`)) has2chars = true;
			if (data.includes(`characters[`)) {
				console.log(data.indexOf("]"));
				let start = data.indexOf("]");
				console.log(data.slice(start + 2, -1));
				charids.push(data.slice(start + 2, -1));
			}
			if (data.includes(`script[${scriptscene}]`)) scriptscene++;
			if (data.includes(`script[`)) {
				if (data.includes(`text`)) {
					console.log(f[data]);
					if (f[data].toString().includes("#1 -")) {
						console.log("INCLUDED THE CAMERA!!!!")
						console.log(f[data].toString().substring(4));
						texts.push(f[data].toString().substring(4));
						// These only matter for certain qvms (Talking picz)
						cam.push("out");
					}
					else {
						texts.push(f[data]);
						// These only matter for certain qvms (Talking picz)
						cam.push("normal");
					}
				}
				if (data.includes(`aid`)) {
					console.log(f[data]);
					mcids.push(f[data]);
				}
				if (data.includes(`char_num`)) {
					console.log(f[data]);
					focuschar = f[data];
					charorder.push(f[data]);
				}
				if (data.includes(`facial`) && data.includes("l][" + focuschar)) {
					console.log(f[data]);
					expressions.push(f[data]);
				}
				if (data.includes(`voice`)) {
					console.log(f[data]);
					voicez.push(f[data]);
				}
			}
		}
		console.log(mcids);
		if (!has2chars) {
			res.json({
				error: 'Your Script has to have 2 lines or More'
			});
			return;
		}
		//Important!!!
		let char1id = charids[1];
		let char2id = charids[0];
		if (qvm_theme == "pt") {
			char2id = charids[1];
		}
		let sound = 0;
		let scenetimes = [];

		let sum = 0;
		let duration;
		const ttsid = [];
		let di;
		let ouri = 0;
		gentts();
		//Had to rewrite this because it kept cutting out clips
		async function gentts() {
			let i = ouri;
			if (mcids[i] == "") {
				var formData = new FormData();
				console.log("page:", i);
				formData.append('voice', voicez[i]);
				formData.append('text', texts[i]);
				var options = {
					hostname: 'localhost',
					port: 4343,
					path: '/goapi/convertTextToSoundAsset/',
					method: 'POST',
					headers: formData.getHeaders()
				};
				var rea = http.request(options, (response) => {
					console.log("DID THE API");
					let body = "";
					response.on("data", (b) => body += b);
					response.on("end", async () => {
						console.log("Body: " + body);
						di = body.slice(22, 33);
						setTimeout(addDuration, 200)
						async function addDuration() {
							const buffer = fs.readFileSync(path.join(afolder, di));
							const duration = await rFileUtil.mp3Duration(buffer);
							if (duration.toString().includes(".")) {
								const round = Math.round(duration);
								let seconds = round / 1000;
								console.log("This is rounding:" + seconds);
								scenetimes.push(seconds + 1);
							} else {
								let seconds = duration / 1000;
								console.log(seconds);
								scenetimes.push(seconds + 1);
							}
							console.log("Id:" + di);
							ttsid.push(di);
							let helper = ttsid.toString();
							while (!ttsid.toString().includes(di)) {
								if (!helper.includes(di)) {
									ttsid.push(di);
									console.log("Keep pushing till its there");
								}
							}
							ouri++;
							if (i == texts.length - 1) {
								await Movie.genxml(qvm_theme, char1id, char2id, expressions, charorder, cam, ttsid, scenetimes, template).then(guy => {
									console.log(guy.success);
									if (guy.success == true)
									{
									res.json({
										script: f,
										player_object: {
											userName: "Jerry",
											userEmail: "jerryguy69420@gmail.com",
											userId: "guythis",
											lid: 7,
											movieId: "qvm",
											siteId: "go",
											autostart: 1,
											isEmbed: 1,
											isWide: "0",
											ut: "23",
											apiserver: "http://localhost:4343/",
											storePath: "http://localhost:4343/static/store/<store>",
											clientThemePath: "http://localhost:4343/static/ad44370a650793d9/<client_theme>"
										}
									});
									}
									else
									{
									res.json({
									error:"A Unknown Error Occured"
									})
									}
								});
								
							} else gentts();
						}
					});
				});
				formData.pipe(rea);
			} else {
				ttsid.push(mcids[i] + ".mp3");
				let helper = ttsid.toString();
				while (!ttsid.toString().includes(mcids[i])) {
					if (!helper.includes(mcids[i])) {
						ttsid.push(mcids[i] + ".mp3");
						console.log("Keep pushing till its there");
					}
				}
				const micbuffer = Asset.load(mcids[i] + ".mp3", true);
				const duration = await rFileUtil.mp3Duration(micbuffer);
				if (duration.toString().includes(".")) {
					const round = Math.round(duration);
					let seconds = round / 1000;
					console.log("This is rounding:" + seconds);
					scenetimes.push(seconds + 1);
				} else {
					let seconds = duration / 1000;
					console.log(seconds);
					scenetimes.push(seconds + 1);
				}
				ouri++;
				if (i == texts.length - 1) {
					await Movie.genxml(qvm_theme, char1id, char2id, expressions, charorder, cam, ttsid, scenetimes, template).then(guy => {
						console.log(guy.success);
						if (guy.success == true)
						{
						res.json({
							script: f,
							player_object: {
								userName: "Jerry",
								userEmail: "jerryguy69420@gmail.com",
								userId: "guythis",
								lid: 7,
								movieId: "qvm",
								siteId: "go",
								autostart: 1,
								isEmbed: 1,
								isWide: "0",
								ut: "23",
								apiserver: "http://localhost:4343/",
								storePath: "http://localhost:4343/static/store/<store>",
								clientThemePath: "http://localhost:4343/static/ad44370a650793d9/<client_theme>"
							}
						});
						}
						else
						{
						res.json({
						error:"A Unknown Error Occured"
						})
						}
					});
				} else gentts();
			}
		}


	})
	//old movies
	.route("POST", "/goapi/saveOldMovie/", async (req, res) => {
		const body = req.body.body;
		const thumb = Buffer.from(req.body.thumbnail_large, "base64");

		Movie.oldSave(body, thumb, req.body.movieId).then((id) => {
			res.end("0" + id);
		}).catch((err) => {
			res.statusCode = 500;
			res.end("1" + err);
			console.error("Error saving movie:", err);
		});
	})
	//  #starter
	.route("POST", "/goapi/saveTemplate/", async (req, res) => {
		res.assert(req.body.body_zip, req.body.thumbnail_large, 400, "1");
		const body = Buffer.from(req.body.body_zip, "base64");
		const thumb = Buffer.from(req.body.thumbnail_large, "base64");

		const id = await Movie.save(body, thumb, req.body.movieId, true)
		res.end("0" + id);
	})
	// thumb
	.route("*", /\/file\/movie\/thumb\/([^/]+)$/, (req, res) => {
		const id = req.matches[1];

		const readStream = Movie.thumb(id);
		res.setHeader("Content-Type", "image/png");
		readStream.pipe(res);
	});

module.exports = group;
