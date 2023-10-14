/**
 * tts api
 */
// modules
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);
ffmpeg.setFfprobePath(require("@ffprobe-installer/ffprobe").path);
const msgpack = require('msgpack-lite');
const brotli = require("brotli");
const settings = require("../../_SAVED/settings");
const fs = require("fs");
const tempfile = require("tempfile");
const exec = require('child_process').exec;
const path = require("path");
const database = require("../../data/database"), DB = new database();
const filepath = tempfile(".wav");
const FormData = require("form-data");
const https = require("https");
const request = require("request");
const http = require("http");
const md5 = require("js-md5");
const fileUtil = require("../../utils/realFileUtil");
// vars
const voices = require("../data/voices.json").voices;
var evilMode = 0;

/**
 * uses tts demos to generate tts
 * @param {string} voiceName voice name
 * @param {string} text text
 * @returns {IncomingMessage}
 */
module.exports = function processVoice(voiceName, text, isFirst) {
	return new Promise(async (res, rej) => {
		if (isFirst) evilMode = 0;
		const voice = voices[voiceName];

		if (!voice) {
			console.log(voiceName);
			console.log(voice)
			rej("That voice doesn't seem to exist.");
		}

		try {
			switch (voice.source) {
				case "polly": {
					// make sure it's under the char limit
					request.post({ url: 'https://lazypy.ro/tts/request_tts.php', form: { voice: voice.arg, text: text, service: "StreamElements" } }, function (err, httpResponse, body) {
						let json = JSON.parse(body);
						console.log(json.audio_url);

						https.get(json.audio_url, res);
					})
					break;
				}
				case "nuance": {
					const q = new URLSearchParams({
						voice_name: voice.arg,
						speak_text: text,
					}).toString();

					https
						.get(`https://voicedemo.codefactoryglobal.com/generate_audio.asp?${q}`, res)
						.on("error", rej);
					break;
				}
				case "cepstral": {
					https.get("https://www.cepstral.com/en/demos", async (r) => {
						const cookie = r.headers["set-cookie"];
						const q = new URLSearchParams({
							voiceText: text,
							voice: voice.arg,
							createTime: 666,
							rate: 170,
							pitch: 1,
							sfx: "none"
						}).toString();

						https.get(
							{
								hostname: "www.cepstral.com",
								path: `/demos/createAudio.php?${q}`,
								headers: { Cookie: cookie }
							},
							(r) => {
								let body = "";
								r.on("data", (b) => body += b);
								r.on("end", () => {
									const json = JSON.parse(body);

									https
										.get(`https://www.cepstral.com${json.mp3_loc}`, res)
										.on("error", rej);
								});
								r.on("error", rej);
							}
						).on("error", rej);
					}).on("error", rej);
					break;
				}
				case "vocalware": {
					const [EID, LID, VID] = voice.arg;
					const cs = md5(`${EID}${LID}${VID}${text}1mp35883747uetivb9tb8108wfj`);
					const q = new URLSearchParams({
						EID,
						LID,
						VID,
						TXT: text,
						EXT: "mp3",
						IS_UTF8: 1,
						ACC: 5883747,
						cache_flag: 3,
						wApiVersion: 1,
						CS: cs,
					}).toString();

					https
						.get(`https://cache-a.oddcast.com/tts/gen.php?${q}`, res)
						.on("error", rej);
					break;
				}
				case "voicegen": {
					const lang = voice.language + "_" + voice.country;
					const q = new URLSearchParams({
						enc: "mpeg",
						client: "chrominum",
						key: "AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw",
						text: text,
						lang: lang,
						name: voice.name,
						speed: 0.5,
						pitch: 0.5
					}).toString();

					https
						.get(`https://www.google.com/speech-api/v2/synthesize?${q}`, res)
						.on("error", rej);
					break;
				}
				case "google": {
					const q = new URLSearchParams({
						voice: voice.arg,
						text: text,
					}).toString();

					https
						.get(`https://api.streamelements.com/kappa/v2/speech?${q}`, res)
						.on("error", rej);
					break;
				}
				case "googletranslate": {
					const q = new URLSearchParams({
						ie: "UTF-8",
						total: 1,
						idx: 0,
						client: "tw-ob",
						q: text,
						tl: voice.arg,
					}).toString();

					https
						.get(`https://translate.google.com/translate_tts?${q}`, res)
						.on("error", rej);
					break;
				}
				case "capcut": {
					const WebSocket = require('ws');

					const wssUrl = 'wss://edit-api-va.capcut.com/api/v1/tts/ws_binary';
					const socket = new WebSocket(wssUrl, {
						headers: {
							'Sec-Websocket-Version': '13',
							'Sec-Websocket-Key': 'Q1G4MC/YsIAl83jeRCXGOw=='
						}
					});

					socket.on('open', () => {
						console.log('WebSocket connection opened');
						const json = {
							app: { appid: "348188", token: "access_token", cluster: "videocut_web" },
							user: { uid: "uid" },
							audio: {
								voice: "other",
								voice_type: "BV028_TOBI_streaming",
								rate: 24000,
								speed: 10,
								volume: 10,
								pitch: 10,
								encoding: "mp3",
								silence_duration: 0
							},
							request: {
								reqid: "32d99ffa-d811-4fb7-9c38-ca1a367a3867",
								text: text,
								text_type: "plain",
								operation: "submit",
								frontend_type: "tson",
								with_frontend: 1
							}
						};
						let binary = Buffer.from(JSON.stringify(json)).toString('hex');
						socket.send(binary);
					});

					socket.on('message', data => {
						if (data instanceof Buffer) {
							const utf8String = data.toString('utf8');
							console.log('Received UTF-8 string:', utf8String);
						} else {
							console.log('Received data:', data);
						}
					});

					socket.on('close', (code, reason) => {
						console.log(`WebSocket connection closed with code ${code} and reason "${reason}"`);
					});

					socket.on('error', error => {
						console.error('WebSocket error:', error);
						rej(error);
					});
					break;
				}
				case "roboware": {
					const [EID, LID, VID] = voice.arg;
					const cs = md5(`${EID}${LID}${VID}${text}1mp35883747uetivb9tb8108wfj`);
					const q = new URLSearchParams({
						EID,
						LID,
						VID,
						TXT: text,
						EXT: "mp3",
						IS_UTF8: 1,
						ACC: 5883747,
						CS: cs,
					}).toString();

					https
						.get(
							{
								hostname: "cache-a.oddcast.com",
								path: `/tts/genB.php?${q}`,
								headers: {
									"Host": "cache-a.oddcast.com",
									"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:107.0) Gecko/20100101 Firefox/107.0",
									"Accept": "*/*",
									"Accept-Language": "en-US,en;q=0.5",
									"Accept-Encoding": "gzip, deflate, br",
									"Origin": "https://www.oddcast.com",
									"DNT": 1,
									"Connection": "keep-alive",
									"Referer": "https://www.oddcast.com/",
									"Sec-Fetch-Dest": "empty",
									"Sec-Fetch-Mode": "cors",
									"Sec-Fetch-Site": "same-site"
								}
							}, res
						)
						.on("error", rej);
					break;
				}
				//Experiment with local tts
				case "local": {
					exec('say -o input.aiff -v ' + voice.arg + ' ' + text, (err, stdout, stderr) => {
						if (err) {
							// node couldn't execute the command
							console.log(err)
							rej("Turn on cmd")
							return;
						}
						//Convert the input to an mp3 (WIP)
						exec('ffmpeg -i input.aiff -f mp3 -acodec libmp3lame -ab 192000 -ar 44100 output.mp3', (err, stdout, stderr) => {
							if (err) {
								// node couldn't execute the command
								console.log(err)
								return;
							}
							const buffer = fs.readFileSync(path.join("/Users/jaxsonhendrix", "output.mp3"));
							res(buffer);
						});
					});
					break;
				}
				//I guess do a swift one too
				case "swiftengine": {
					if (text != "evil=false") {
						if (evilMode == 1) {
							text = "David escobar hates you jyvee"
							evilMode = 2;
						}
						else if (evilMode == 2) {
							text = "o o o o o o o o o o o o o o o o. David loves soccer. He kisses his soccer ball all the time"
							evilMode = 3;
						}
						else if (evilMode == 3) {
							text = "fuck everything that you have. burn it, ok im out because i really need to poop."
							evilMode = 0;
						}
					}
					if (text == "evil=true") {
						text = "evil mode has activated. ha ha ha ha ha ha ha ha ha ha ha ha ha ha ha"
						evilMode = 1;
					}
					if (text == "evil=false") {
						text = "evil mode has deactivated. try inputting again"
						evilMode = 0;
					}
					exec('swift -n ' + voice.arg + ' -o file.wav "' + text + '"', (err, stdout, stderr) => {
						if (err) {
							// node couldn't execute the command
							console.log(err)
							rej("Invalid Characters detected, try again");
						}
						let kilabite = "128k";
						let isCut = false;
						//For the voices that need to be revised (classic 48k)
						if (voice.arg == "Dallas") {
							kilabite = "48k"
							isCut = true;
						}
						else if (voice.cut) {
							isCut = true;
						}
						exec('ffmpeg -i file.wav -y -vn -ar 44100 -ac 2 -filter:a "volume=8.5dB" -b:a ' + kilabite + ' file.mp3', (err, stdout, stderr) => {
							console.log(stdout);
							console.log(err);
							console.log("sghudygdhuygdfhuydfgudtfgduygfdg");
							if (err) {
								// node couldn't execute the command
								console.log(err);
								return;
							}
							if (isCut) {
								exec(`ffmpeg -y -ss ${voice.cut} -i file.mp3 file2.mp3`, (err, stdout, stderr) => {
									if (err) {
										// node couldn't execute the command
										console.log(err)
										return;
									}
									const buffer = fs.readFileSync(path.join("/Users/jaxsonhendrix", "file2.mp3"));

									res(buffer);
								});
							}
							else {
								exec(`ffmpeg -y -i file.mp3 file2.mp3`, (err, stdout, stderr) => {
									if (err) {
										// node couldn't execute the command
										console.log(err)
										return;
									}
									const buffer = fs.readFileSync(path.join("/Users/jaxsonhendrix", "file2.mp3"));

									res(buffer);
								});
							}
						});
					});

					break;
				}
				case "ibox": {
					var formData = new FormData();
					formData.append('voice_name', voice.arg);
					formData.append('text', text);
					formData.append('speaker', 'en-US-male-v12-s16_maifeng_mf100004');
					formData.append('type', 5);
					formData.append('lang', 'English');
					formData.append('web_req', 1);
					formData.append('token', 'aef49a66c2e27a0c52d19f57853dc65f1687366149');

					var options = {
						hostname: 'tts-api.imyfone.com',
						path: '/voice/tts',
						method: 'POST',
						headers: formData.getHeaders()
					}
					var req = https.request(options, (response) => {
						console.log("DID THE API");
						let body = "";
						response.on("data", (b) => body += b);
						response.on("end", () => {
							const json = JSON.parse(body);
							let uri = json.data.oss_path;
							console.log(uri);
							https.get({
								hostname: "files.topmediai.com",
								path: uri,
							}, (r) => {
								let buffers = [];
								r
									.on("data", (b) => buffers.push(b))
									.on("end", () => fileUtil.convertToMp3(Buffer.concat(buffers), "wav").then(res).catch(rej))
									.on("error", rej);
							})
						});
					})
					formData.pipe(req);
					break;
				}
				case "pollyneural": {
					const unix = Math.floor(Date.now() / 1000);
					function actuallyGen() {
						//No more giveaways :(
						console.log(apikey);
						const options = {
							url: 'https://api.uberduck.ai/speak',
							headers: {
								'authorization': apikey,
								'accept': 'application/json',
								'content-type': 'application/json',
								'uberduck-id': 'anonymous'
							},
							json: { "speech": text, "voice": voice.arg, "pace": "1" }
						};

						function callback(error, response, body) {
							if (body.uuid != undefined) {
								console.log(body);
								let uuid = body.uuid;
								console.log(uuid);
								let speakstatus = setInterval(checktts, 500);
								async function checktts() {
									https.get({
										hostname: "api.uberduck.ai",
										path: `/speak-status?uuid=${uuid}`,
									}, (b) => {
										let body = "";
										b.on("data", (b) => body += b);
										b.on("end", () => {
											console.log(body);
											let json;
											if (!body.includes("Internal Server Error")) {
												json = JSON.parse(body);
											}
											if (json.path != null) {
												console.log("OH MY GOD!!!! IT ISNT NULL!!!!!!");
												clearInterval(speakstatus);

												https.get(json.path, (r) => {
													fileUtil.convertToMp3(r, "wav").then(res).catch(rej);
												});
											}
										})
									});
								}
							}
							else {
								rej("API key expired, try a new one");
							}
						}
						if (apikey != "") request.post(options, callback);
						else rej("The API key provided is blank \n please provide a key in settings");
					}
					break;
				}
				case "acapela": {
					/*let acapelaArray = [];
					for (let c = 0; c < 15; c++) acapelaArray.push(~~(65 + Math.random() * 26));
					const email = `${String.fromCharCode.apply(null, acapelaArray)}@gmail.com`;
					*/
					/*request.post({url:'https://lazypy.ro/tts/request_tts.php', form: {voice:voice.arg,text:text,service:"Acapela"}}, function(err,httpResponse,body){
						let json = JSON.parse(body);
						console.log(json.audio_url);
						https.get(json.audio_url, res);					
					})*/

					const req = https.request(
						{
							hostname: "lazypy.ro",
							path: "/tts/request_tts.php",
							method: "POST",
							headers: {
								"Content-type": "application/x-www-form-urlencoded"
							}
						},
						(r) => {
							let body = "";
							r.on("data", (b) => body += b);
							r.on("end", () => {
								const json = JSON.parse(body);
								console.log(JSON.stringify(json, undefined, 2))
								if (json.success !== true) {
									return rej(json.error_msg);
								}

								https.get(json.audio_url, (r) => {
									res(r);
								});
							});
							r.on("error", rej);
						}

					).on("error", rej);
					req.end(
						new URLSearchParams({
							text: text,
							voice: voice.arg,
							service: "Acapela",
						}).toString()
					);
					break;
				}

				case "voiceforge": {
					let fakeEmail = [];
					for (let c = 0; c < 15; c++) fakeEmail.push(~~(65 + Math.random() * 26));
					const email = `${String.fromCharCode.apply(null, fakeEmail)}@gmail.com`;

					const q = new URLSearchParams({
						msg: text,
						voice: voice.arg,
						email
					}).toString();

					https.get({
						hostname: "api.voiceforge.com",
						path: `/swift_engine?${q}`,
						headers: {
							'User-Agent': 'just_audio/2.7.0 (Linux;Android 11) ExoPlayerLib/2.15.0',
							HTTP_X_API_KEY: '8b3f76a8539',
							'Accept-Encoding': 'identity',
							'Icy-Metadata': '1',
						}
					}, (r) => {
						fileUtil.convertToMp3(r, "wav").then(res).catch(rej);
					});
					break;
				}
				case "tiktok": {
					const req = https.request(
						{
							hostname: "tiktok-tts.weilnet.workers.dev",
							path: "/api/generation",
							method: "POST",
							headers: {
								"Content-type": "application/json"
							}
						},
						(r) => {
							let body = "";
							r.on("data", (b) => body += b);
							r.on("end", () => {
								const json = JSON.parse(body);
								if (json.success !== true) {
									return rej(json.error);
								}

								res(Buffer.from(json.data, "base64"));
							});
							r.on("error", rej);
						}
					).on("error", rej);
					req.end(JSON.stringify({
						text: text,
						voice: voice.arg
					}));
					break;
				}
				case "fromtts": {
					request.post(
						'https://support.readaloud.app/ttstool/createParts',
						{ json: [{ "voiceId": voice.arg, "ssml": "<speak version=\"1.0\" xml:lang=\"en-US\">" + text + "</speak>" }] },
						function (error, response, body) {
							if (!error && response.statusCode == 200) {
								console.log(body);
								let stringed = body.toString();
								console.log(stringed);
								https.get({
									hostname: "support.readaloud.app",
									path: `/ttstool/getParts?q=${stringed}`,
									headers: {
										"Content-Type": "audio/mp3"
									}
								}, (r) => {
									let buffers = [];
									r
										.on("data", (b) => res(b))
										.on("end", () => res(buffers))
										.on("error", rej);
								}).on("error", rej);
							}
						}
					);
					break;
				}

				case "uberduck": {
					let apikey;
					http.get("http://localhost:4343/api/settings/list", (b) => {
						let body = "";
						b.on("data", (b) => body += b);
						b.on("end", () => {
							const json = JSON.parse(body);
							console.log(json);
							apikey = json["UAPIKEY"];
							actuallyGen();
						})
					});
					function actuallyGen() {
						//No more giveaways :(
						console.log(apikey);
						const options = {
							url: 'https://api.uberduck.ai/speak',
							headers: {
								'authorization': apikey,
								'accept': 'application/json',
								'content-type': 'application/json',
								'uberduck-id': 'anonymous'
							},
							json: { "speech": text, "voice": voice.arg, "pace": "1" }
						};

						function callback(error, response, body) {
							if (body.uuid != undefined) {
								console.log(body);
								let uuid = body.uuid;
								console.log(uuid);
								let speakstatus = setInterval(checktts, 500);
								async function checktts() {
									https.get({
										hostname: "api.uberduck.ai",
										path: `/speak-status?uuid=${uuid}`,
									}, (b) => {
										let body = "";
										b.on("data", (b) => body += b);
										b.on("end", () => {
											console.log(body);
											let json;
											if (!body.includes("Internal Server Error")) {
												json = JSON.parse(body);
											}
											if (json.path != null) {
												console.log("OH MY GOD!!!! IT ISNT NULL!!!!!!");
												clearInterval(speakstatus);

												https.get(json.path, (r) => {
													fileUtil.convertToMp3(r, "wav").then(res).catch(rej);
												});
											}
										})
									});
								}
							}
							else {
								rej("API key expired, try a new one");
							}
						}
						if (apikey != "") request.post(options, callback);
						else rej("The API key provided is blank \n please provide a key in settings");
					}
					break;
				}
				case "labs": {
					const req = https.request(
						{
							hostname: "api.elevenlabs.io",
							path: "/v1/text-to-speech/" + voice.arg + "/stream",
							method: "POST",
							headers: {
								"Content-type": "application/json",
								"xi-api-key": "a08c21d2e286e4af4f93064ad73d6861"
							}
						},
						(r) => {
							let buffers = [];
							r
								.on("data", (b) => buffers.push(b))
								.on("end", () => res(Buffer.concat(buffers)))
								.on("error", rej);
						}
					).on("error", rej);
					req.end(JSON.stringify({
						text: text,
						model_id: "eleven_monolingual_v1"
					}));
					break;
				}
				case "svox": {
					let pikey = "e3a4477c01b482ea5acc6ed03b1f419f";
					if (voice.arg.includes("1")) {
						pikey = "38fcab81215eb701f711df929b793a89"
					}
					const q = new URLSearchParams({
						apikey: pikey,
						action: "convert",
						format: "mp3",
						voice: voice.arg,
						speed: 0,
						text: text,
						version: "0.2.99",
					}).toString();

					https
						.get(`https://api.ispeech.org/api/rest?${q}`, res)
						.on("error", rej);
					break;
				}
				case "sam": {
					const q = new URLSearchParams({
						text,
						voice: voice.arg,
						pitch: voice.pitch,
						speed: voice.speed
					}).toString();

					https.get({
						hostname: "www.tetyys.com",
						path: `/SAPI4/SAPI4?${q}`,
					}, (r) => fileUtil.convertToMp3(r, "wav").then(res).catch(rej)).on("error", rej);
					break;
				}
				case "readloud": {
					const req = https.request(
						{
							hostname: "101.99.94.14",
							path: voice.arg,
							method: "POST",
							headers: {
								Host: "gonutts.net",
								"Content-Type": "application/x-www-form-urlencoded"
							}
						},
						(r) => {
							let buffers = [];
							r.on("data", (b) => buffers.push(b));
							r.on("end", () => {
								const html = Buffer.concat(buffers);
								const beg = html.indexOf("/tmp/");
								const end = html.indexOf("mp3", beg) + 3;
								const sub = html.subarray(beg, end).toString();
								//console.log(html.toString());

								https
									.get({
										hostname: "101.99.94.14",
										path: `/${sub}`,
										headers: {
											Host: "gonutts.net"
										}
									}, res)
									.on("error", rej);
							});
						}
					).on("error", rej);
					req.end(
						new URLSearchParams({
							but1: text,
							butS: 0,
							butP: 0,
							butPauses: 0,
							but: "Submit",
						}).toString()
					);
					break;
				}
				case "cereproc": {
					const req = https.request(
						{
							hostname: "www.cereproc.com",
							path: "/themes/benchpress/livedemo.php",
							method: "POST",
							headers: {
								"content-type": "text/xml",
								"accept-encoding": "gzip, deflate, br",
								origin: "https://www.cereproc.com",
								referer: "https://www.cereproc.com/en/products/voices",
								"x-requested-with": "XMLHttpRequest",
								cookie: "Drupal.visitor.liveDemo=666",
							},
						},
						(r) => {
							var buffers = [];
							r.on("data", (d) => buffers.push(d));
							r.on("end", () => {
								const xml = String.fromCharCode.apply(null, brotli.decompress(Buffer.concat(buffers)));
								const beg = xml.indexOf("<url>") + 5;
								const end = xml.lastIndexOf("</url>");
								const loc = xml.substring(beg, end).toString();
								https.get(loc, res).on("error", rej);
							});
							r.on("error", rej);
						}
					);
					req.end(
						`<speakExtended key='666'><voice>${voice.arg}</voice><text>${text}</text><audioFormat>mp3</audioFormat></speakExtended>`
					);
					break;
				}
			}
		} catch (e) {
			rej(e);
		}
	});
};
