/**
 * movie api
 */
// module
const fs = require("fs");
const nodezip = require("node-zip");
const path = require("path");
const Parse = require("../models/parse");
// vars
const folder = path.join(__dirname, "../../", process.env.SAVED_FOLDER);
const base = Buffer.alloc(1, 0);
// stuff
const database = require("../../data/database"), DB = new database();
const fUtil = require("../../utils/fileUtil");
const parse = require("../models/parse");
let settings;
let guy = 0;
let moviearray = [];
let scenecache = [];
let cachedmovie = [];
let camarray, textarra, micids, charorder = [];
module.exports = {
	/**
	 * Deletes a movie.
	 * @param {string} id 
	 */
	delete(id) {
		DB.delete("movies", id);

		// delete the actual file
		fs.unlinkSync(path.join(folder, `${id}.xml`));
		fs.unlinkSync(path.join(folder, `${id}.png`));
	},

	/**
	 * Parses a saved movie for the LVM.
	 * @param {string} mId 
	 * @param {boolean} isGet 
	 * @returns {Promise<Buffer>}
	 */
	async load(mId, isGet = true) {
		let filepath;
		filepath = path.join(folder, `${mId}.xml`);

		const buffer = fs.readFileSync(filepath);
		const thumbBuffer = fs.readFileSync(filepath.slice(0, -3) + "png");
		const parsed = await Parse.pack(buffer, thumbBuffer);
		return isGet ? parsed : Buffer.concat([base, parsed]);
	},

	/**
	 * Gets movie metadata from an XML.
	 * @param {string} id the movie id
	 * @returns {{
	 * 	date: Date,
	 *  durationString: string,
	 * 	duration: number,
	 *  sceneCount?: count,
	 * 	title: string,
	 * 	id: string
	 * }} 
	 */
	async meta(id, tile) {
		const filepath = path.join(folder, `${id}.xml`);
		const buffer = fs.readFileSync(filepath);
		let title;
		// title
		if (id != "qvm") {
			title = buffer.subarray(
				buffer.indexOf("<title>") + 16,
				buffer.indexOf("]]></title>")
			).toString().trim();
		}
		else {
			title = tile;
		}

		// get the duration string
		const durBeg = buffer.indexOf('duration="') + 10;
		const duration = Number.parseFloat(buffer.subarray(
			durBeg,
			buffer.indexOf('"', durBeg)
		).toString().trim());
		const min = ('' + ~~(duration / 60)).padStart(2, '0');
		const sec = ('' + ~~(duration % 60)).padStart(2, '0');
		const durationStr = `${min}:${sec}`;

		let count = 0;
		let pos = buffer.indexOf('<scene id=');
		while (pos > -1) {
			count++;
			pos = buffer.indexOf('<scene id=', pos + 10);
		}

		return {
			id,
			duration,
			title,
			date: fs.statSync(filepath).mtime,
			durationString: durationStr,
			sceneCount: count,
		};
	},
	/**
	 * Qvms save differently
	 * Instead of saving the id as "qvm" it fetches the metadata from its og movie id and uses that
	 * to save it to the database
	 * Also requires @param {string} title
	 */
	async saveqvm(title) {
		let pid = "qvm";
		this.meta(pid, title).then((meta) => {
			let type;
			const oldxml = fs.readFileSync(path.join(folder, "qvm.xml"));
			//For now, just use the default qvm thumbnail until its sorted out by template types
			const thumb = fs.readFileSync(path.join(folder, "qvm.png"));
			let id = fUtil.generateId();
			fs.writeFileSync(path.join(folder, `${id}.png`), thumb);
			fs.writeFileSync(path.join(folder, `${id}.xml`), oldxml);
			const info = {
				id,
				duration: meta.durationString,
				date: meta.date,
				title: meta.title,
				sceneCount: meta.sceneCount,
			}
			type = "movies";
			DB.insert(type, info);
		});
	},
	/**
	 * Extracts the movie XML from a zip and saves it.
	 * @param {Buffer} body the movie xml
	 * @param {Buffer} thumb movie thumbnail in .png format
	 * @param {string} mId movie id, if overwriting an old one
	 * @param {boolean} starter is it a starter
	 * @returns {Promise<string>}
	 */
	async save(body, thumb, id, starter) {
		return new Promise((resolve, reject) => {
			id ||= fUtil.generateId();

			// save the thumbnail on manual saves
			if (thumb != "nan") {
				if (thumb) {
					fs.writeFileSync(path.join(folder, `${id}.png`), thumb);
				}
			}

			// extract the movie xml and save it
			const zip = nodezip.unzip(body);
			const xmlStream = zip["movie.xml"].toReadStream();

			let writeStream = fs.createWriteStream(path.join(folder, `${id}.xml`));
			xmlStream.on("data", b => writeStream.write(b));
			xmlStream.on("end", async () => {
				writeStream.close((e) => {
					if (e) throw e;

					this.meta(id).then((meta) => {
						let type;
						const info = {
							id,
							duration: meta.durationString,
							date: meta.date,
							title: meta.title,
							sceneCount: meta.sceneCount,
						}
						if (starter) {
							info.type = "movie";
							type = "assets";
						} else {
							type = "movies";
						}

						try {
							DB.update(type, id, info);
						} catch (e) {
							console.log("This movie does not exist in the database. Inserting...", e);
							DB.insert(type, info);
						}
						resolve(id);
					});
				});
			});
		});
	},
	async oldSave(body, thumb, id) {
		return new Promise((resolve, reject) => {
			id ||= fUtil.generateId();

			// save the thumbnail on manual saves
			if (thumb) fs.writeFileSync(path.join(folder, `${id}.png`), thumb);

			fs.writeFileSync(path.join(folder, `${id}.xml`), body);
			this.meta(id).then((meta) => {
				let type = "movies";
				const info = {
					id,
					duration: meta.durationString,
					date: meta.date,
					title: meta.title,
					sceneCount: meta.sceneCount,
				}
				try {
					DB.update(type, id, info);
				} catch (e) {
					console.log("This movie does not exist in the database. Inserting...", e);
					DB.insert(type, info);
				}
				resolve(id);
			});
		});
	},
	async genxml(theme, c1, c2, textarray, charorders, cam, micids, times, id) {
		console.log(c1, c2);
		return new Promise((resolve, reject) => {
			moviearray = [];
			const xml2js = require('xml2js');

			function xmlToJson(xmlString) {
				return new Promise((resolve, reject) => {
					const parser = new xml2js.Parser();
					parser.parseString(xmlString, (err, result) => {
						if (err) {
							reject(err);
						} else {
							resolve(result);
						}
					});
				});
			}
			//Until then only use template1
			let scenetimes = times;
			let sound = 0;
			cachedmovie = [];
			scenecache = [];
			moviearray = [];
			let moviexml;
			console.log(theme);
			if (fs.existsSync(path.join(__dirname, "../../_TEMPLATES", `${id}_${theme}.xml`))) {
				moviexml = fs.readFileSync(path.join(__dirname, "../../_TEMPLATES", `${id}_${theme}.xml`)).toString();
				settings = JSON.parse(fs.readFileSync(path.join(__dirname, "../../_TEMPLATES", `${id}_${theme}.json`)).toString());
			}
			else {
				resolve({ "success": false });
				return;
			}
			//let jObj = "";
			const xmlJs = require('xml-js');
			function jsonToXml(jsonData) {
				const options = {
					compact: true,
					ignoreComment: true,
					spaces: 4
				};
				return xmlJs.js2xml(jsonData, options);
			}
			let scenejsoncache = [];
			xmlToJson(moviexml)
				.then(async jsonOutput => {
					//Add the first scene timings
					for (let v of settings.toffset) {
						scenetimes.unshift(v);
					}
					//Add the last scene timings
					for (let v of settings.toffset_end) {
						scenetimes.push(v);
					}
					//The qvms will be a straight line of an xml! for now
					for (let i = 0; i < Infinity; i++) {
						if (cachedmovie.join("").toString().includes("<sc")) {
							//console.log(cachedmovie.join(""), "also here");
							moviearray.push(cachedmovie.join("").slice(0, -3));
							cachedmovie = [];
							break;
						}
						else {
							cachedmovie.push(moviexml.charAt(i));
						}
						if (i >= 5200) {
							break;
						}
					}
					//Meta all the scenes
					for (let number = 0; number < jsonOutput.film.scene.length; number++) {
						let ruffer = jsonOutput.film.scene[number];
						this.sceneMeta2Xml(ruffer, number);
					}
					//This vars is for the thingy!!
					let hasPassedStartPos = false;
					let hasPassedEndPos = false;
					let grrrrrr = [];
					let avaternum = 1133;
					let avatournum = 1134;
					let bum = 0;
					let swapnum1 = "1";
					let swapnum2 = "2";
					if (settings.swap == true) {
						swapnum1 = "2";
						swapnum2 = "1";
					}
					let sum = 0;
					for (let i = 0; i < scenetimes.length; i++) {
						sum = sum + scenetimes[i]; // The old math script didnt work. So I made one myself
					}
					//Time to generate for real
					for (let num = 0; num < scenetimes.length; num++) {
						let pson;
						if (num == settings.startPos && !hasPassedStartPos) {
							hasPassedStartPos = true;
						}
						//console.log(JSON.stringify(pson));
						function jsonToXml(jsonData) {
							const options = {
								compact: true,
								ignoreComment: true,
								spaces: 4
							};
							return xmlJs.js2xml(jsonData, options);
						}
						console.log(num, hasPassedEndPos);
						if (micids[num - settings.startPos] == undefined && hasPassedStartPos || hasPassedEndPos) {
							console.log("ended");
							hasPassedStartPos = false;
							hasPassedEndPos = true;
							bum++;
							console.log(settings.toffset_end[bum - 1]);
							if (settings.toffset_end[bum - 1] === undefined) {
								console.log("And we're out");
								//break;
							}
						}
						if (hasPassedStartPos) {
							if (charorders[num - settings.startPos] == swapnum1) {
								let scenepson;
								if (cam[num - settings.startPos] != "normal") {
									scenepson = await xmlToJson(scenecache[settings.char1camscene]);
								}
								else {
									scenepson = await xmlToJson(scenecache[settings.char1scene]);
								}
								grrrrrr.push(avaternum.toString());
								grrrrrr.push(avatournum.toString());
								for (const v in scenepson.scene.char) {
									if (scenepson.scene.char[v]._attributes.id == settings.avater1id) {
										let maction = scenepson.scene.char[v].action[0]._text.toString().split(".");
										scenepson.scene.char[v]._attributes.id = "AVATOR" + avaternum;
										maction[1] = c1;
										console.log(c1);
										//Only make a head if it doesnt exist already
										if (charorders[num - settings.startPos] == swapnum2) {
											if (!scenepson.scene.char[v].head) {
												scenepson.scene.char[v].head = [];
												scenepson.scene.char[v].head.push(
													{
														_attributes: {
															id: "PROP29817",
															raceCode: "1"
														},
														file: [
															"ugc." + maction[1] + ".head.head_" + textarray[num - settings.startPos] + ".xml"
														]
													});
											}
											else {
												scenepson.scene.char[v].head[0].file[0] = "ugc." + maction[1] + ".head.head_" + textarray[num - settings.startPos] + ".xml";
											}
										}
										scenepson.scene.char[v].action[0]._text = maction.join(".");
									}
									if (scenepson.scene.char[v]._attributes.id == settings.avater2id) {
										scenepson.scene.char[v]._attributes.id = "AVATOR" + avatournum;
										let maction = scenepson.scene.char[v].action[0]._text.toString().split(".");
										maction[1] = c2;
										console.log(c2);
										//Only make a head if it doesnt exist already
										if (charorders[num - settings.startPos] == swapnum1) {
											if (!scenepson.scene.char[v].head) {
												console.log("The qvm goes in here even when its not supposed to");
												scenepson.scene.char[v].head = [];
												scenepson.scene.char[v].head.push(
													{
														_attributes: {
															id: "PROP165678",
															raceCode: "1"
														},
														file: [
															"ugc." + maction[1] + ".head.head_" + textarray[num - settings.startPos] + ".xml"
														]
													});
											}
											else {
												scenepson.scene.char[v].head[0].file[0] = "ugc." + maction[1] + ".head.head_" + textarray[num - settings.startPos] + ".xml";
											}
										}
										scenepson.scene.char[v].action[0]._text = maction.join(".");
									}
								}
								scenepson.scene._attributes.index = num;
								scenepson.scene._attributes.id = "SCENE" + num;
								scenepson.scene._attributes.adelay = Math.round(scenetimes[num]) * 24;
								const xmlData = jsonToXml(scenepson);
								scenejsoncache.push(xmlData);
								avaternum += 2;
								avatournum += 2;
							}
							else {
								let scenepson;
								if (cam[num - settings.startPos] != "normal") {
									scenepson = await xmlToJson(scenecache[settings.char2camscene]);
								}
								else {
									scenepson = await xmlToJson(scenecache[settings.char2scene]);
								}
								grrrrrr.push(avaternum.toString());
								grrrrrr.push(avatournum.toString());
								for (const v in scenepson.scene.char) {
									if (scenepson.scene.char[v]._attributes.id == settings.avater1id) {
										let maction = scenepson.scene.char[v].action[0]._text.toString().split(".");
										scenepson.scene.char[v]._attributes.id = "AVATOR" + avaternum;

										maction[1] = c1;
										console.log(c1);
										//Only make a head if it doesnt exist already
										if (charorders[num - settings.startPos] == swapnum2 && !scenepson.scene.char[v].head) {
											if (!scenepson.scene.char[v].head) {
												scenepson.scene.char[v].head = [];
												scenepson.scene.char[v].head.push(
													{
														_attributes: {
															id: "PROP282778",
															raceCode: "1"
														},
														file: [
															"ugc." + maction[1] + ".head.head_" + textarray[num - settings.startPos] + ".xml"
														]
													});
											}
											else {
												scenepson.scene.char[v].head[0].file[0] = "ugc." + maction[1] + ".head.head_" + textarray[num - settings.startPos] + ".xml";
											}
										}
										scenepson.scene.char[v].action[0]._text = maction.join(".");
										//console.log(maction.join("."));
									}
									if (scenepson.scene.char[v]._attributes.id == settings.avater2id) {
										let maction = scenepson.scene.char[v].action[0]._text.toString().split(".");
										scenepson.scene.char[v]._attributes.id = "AVATOR" + avatournum;
										maction[1] = c2;
										console.log(c2);
										//Only make a head if it doesnt exist already
										if (charorders[num - settings.startPos] == swapnum1 && !scenepson.scene.char[v].head) {
											if (!scenepson.scene.char[v].head) {
												scenepson.scene.char[v].head = [];												
												scenepson.scene.char[v].head.push(
													{
														_attributes: {
															id: "PROP165678",
															raceCode: "1"
														},
														file: [
															"ugc." + maction[1] + ".head.head_" + textarray[num - settings.startPos] + ".xml"
														]
													});
											}
											else {
												console.log("char2");
												scenepson.scene.char[v].head[0].file[0] = "ugc." + maction[1] + ".head.head_" + textarray[num - settings.startPos] + ".xml";
											}
										}
										scenepson.scene.char[v].action[0]._text = maction.join(".");
									}
								}
								scenepson.scene._attributes.index = num;
								scenepson.scene._attributes.id = "SCENE" + num;
								scenepson.scene._attributes.adelay = Math.round(scenetimes[num]) * 24;
								const xmlData = jsonToXml(scenepson);
								scenejsoncache.push(xmlData);
								avaternum += 2;
								avatournum += 2;
							}
						}
						else {
							if (!hasPassedEndPos) {
								pson = await xmlToJson(scenecache[num]);
									if (num != 0) {
										//Assign the correct chars
										for (const v in pson.scene.char) {
											if (pson.scene.char[v]._attributes.id == settings.avater1id) {
												let maction = pson.scene.char[v].action[0]._text.toString().split(".");
												maction[1] = c1;
												pson.scene.char[v].action[0]._text = maction.join(".");
												//console.log(maction.join("."));
											}
											if (pson.scene.char[v]._attributes.id == settings.avater2id) {
												let maction = pson.scene.char[v].action[0]._text.toString().split(".");
												maction[1] = c2;
												pson.scene.char[v].action[0]._text = maction.join(".");
											}
										}
									}
									pson.scene._attributes.index = num;
									pson.scene._attributes.id = "SCENE" + num;
									if (scenetimes[num] == 0.25 || scenetimes[num] == 0.5 || scenetimes[num] == 0.75)
									{
									pson.scene._attributes.adelay = scenetimes[num] * 24;
									}
									else
									{
									pson.scene._attributes.adelay = Math.round(scenetimes[num]) * 24;
									}
									const xmlData = jsonToXml(pson);
									scenejsoncache.push(xmlData);
								}
								else {
									let dson = await xmlToJson(scenecache[(settings.endPos - 1) + bum]);
									for (const v in dson.scene.char) {
										if (dson.scene.char[v]._attributes.id == settings.avater1id) {
											let maction = dson.scene.char[v].action[0]._text.toString().split(".");
											dson.scene.char[v]._attributes.id = "AVATOR" + avaternum;
											maction[1] = c1;
											dson.scene.char[v].action[0]._text = maction.join(".");
											//console.log(maction.join("."));
										}
										if (dson.scene.char[v]._attributes.id == settings.avater2id) {
											let maction = dson.scene.char[v].action[0]._text.toString().split(".");
											dson.scene.char[v]._attributes.id = "AVATOR" + avatournum;

											maction[1] = c2;
											dson.scene.char[v].action[0]._text = maction.join(".");
											//console.log(maction.join("."));
										}
									}
									dson.scene._attributes.index = num;
									dson.scene._attributes.id = "SCENE" + num;
									dson.scene._attributes.adelay = Math.round(settings.toffset_end[bum - 1]) * 24;
									const xmlData = jsonToXml(dson);
									scenejsoncache.push(xmlData);
								}
							}
						}
						//console.log(scenejsoncache);
						//console.log("poop", times);
						//Time for the cool thing people want, SOUNDNDUdyiesiuhdwogyftdwcuxei2wpuyfdtewsuiefpwdyftdewusipfeuwystfdrewyu
						//Add a placeholder sound for some reason idk
						if (settings.usesSong == "Y")
						{
						scenejsoncache.push(`<sound id="SOUND0" index="0" track="0" vol="0.75" tts="0">
						<sfile>${settings.song}</sfile>
						<start>1</start>
						<stop>${(sum * 72)}</stop>
						<trimEnd>${(sum * 72)}</trimEnd>
						<fadein duration="48" vol="1"/>
						<fadeout duration="48" vol="0"/>
						</sound>`);
						}
						scenejsoncache.push(`<sound id="SOUND2" index="1" track="0" vol="1" tts="1">
					<sfile>ugc.${micids[0]}</sfile>
					<start>${settings.audioOffset}</start>
					<stop>${(Math.round(times[settings.toffset.length]) * 24) + settings.audioOffset}</stop>
					<fadein duration="0" vol="0"/>
					<fadeout duration="0" vol="0"/>
					<ttsdata>
					<type><![CDATA[tts]]></type>
					<text><![CDATA[poop]]></text>
					<voice><![CDATA[joey1]]></voice>
					</ttsdata>
					</sound>`);
						sound = 4;
						let endingformat = settings.audioOffset;
						for (let i = 1; i < micids.length; i++) {
							scenejsoncache.push(`
			<sound id="SOUND${sound}" index="${i + 1}" track="0" vol="1" tts="1">
			<sfile>ugc.${micids[i]}</sfile>
			<start>${(Math.round(times[settings.toffset.length + i - 1]) * 24) + endingformat}</start>
			<stop>${(Math.round(times[settings.toffset.length + i]) * 24) + (times[settings.toffset.length + i - 1] * 24) + endingformat}</stop>
			<fadein duration="0" vol="0"/>
			<fadeout duration="0" vol="0"/>
			<ttsdata>
			<type><![CDATA[tts]]></type>
			<text><![CDATA[poop]]></text>
			<voice><![CDATA[converted from the qvm]]></voice>
			</ttsdata>
			</sound>
			`);
							sound += 2;
							endingformat = (Math.round(times[settings.toffset.length + i - 1]) * 24) + endingformat;
						}
						let soundoffset = 2;
						let sceneoffset = settings.toffset.length;
						let owne = 1;
						let twro = 2;
						if (settings.swap) {
							//OMG SWAP FOR ONE CHARRRR
							owne = 2;
							twro = 1;
						}
						for (let i = 0; i < charorders.length; i++) {
							if (charorders[i] == "1") scenejsoncache.push(`<linkage>SOUND${soundoffset},SCENE${sceneoffset}~~~AVATOR${grrrrrr[soundoffset - owne]}</linkage>`);
							else if (charorders[i] == "2") scenejsoncache.push(`<linkage>SOUND${soundoffset},SCENE${sceneoffset}~~~AVATOR${grrrrrr[soundoffset - twro]}</linkage>`);
							soundoffset += 2;
							sceneoffset++;
						}
						fs.writeFileSync(path.join(__dirname, "../../_SAVED", "qvm.xml"), moviearray + scenejsoncache.join("") + "</film>");
						//console.log("ITS DONE!");
					})
			resolve({ "success": true });
		});
	},
	/**
	 * Converts a movie scene into an xml. Puts it in the scene array: @var {array} scenearray
	 * @param {string} pson 
	 * @param {num} scenepos 
	 * @returns {fs.readStream}
	 */
	sceneMeta2Xml(v, num = 0) {
		const xmlJs = require('xml-js');
		function jsonToXml(jsonData) {
			const options = {
				compact: true,
				ignoreComment: true,
				spaces: 4
			};
			return xmlJs.js2xml(jsonData, options);
		}
		//if (num != 0) v.char[0]._attributes.id = "AVATER121";
		//if (num != 0) v.char[1]._attributes.id = "AVATER122";
		let xnl = jsonToXml({ scene: v });
		scenecache.push(xnl);
	},
	/**
	 * Returns a stream of a movie thumbnail.
	 * @param {string} id 
	 * @returns {fs.readStream}
	 */
	thumb(id) { // look for match in folder
		const filepath = path.join(folder, `${id}.png`);
		if (fs.existsSync(filepath)) {
			const readStream = fs.createReadStream(filepath);
			return readStream;
		} else {
			throw new Error("Movie doesn't exist.");
		}
	},
}
