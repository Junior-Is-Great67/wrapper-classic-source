/*
movie parsing
 if you don't know what's going on here, look at the lvm's code
 ffdec does a great job with that
*/
const fs = require("fs");
const nodezip = require("node-zip");
const path = require("path");
const xmldoc = require("xmldoc");
const database = require("../../data/database"), DB = new database();
const char = require("./char");
const fUtil = require("../../utils/fileUtil");
const asset = require("./asset");
const source = path.join(__dirname, "../../server", process.env.CLIENT_URL);
const store = path.join(__dirname, "../../server", process.env.STORE_URL);
const header = process.env.XML_HEADER;

function name2Font(font) {
	switch (font) {
		case "Blambot Casual":
			return "FontFileCasual";
		case "BadaBoom BB":
			return "FontFileBoom";
		case "Entrails BB":
			return "FontFileEntrails";
		case "Tokyo Robot Intl BB":
			return "FontFileTokyo";
		case "Accidental Presidency":
			return "FontFileAccidental";
		case "Budmo Jiggler":
			return "FontFileBJiggler";
		case "Budmo Jigglish":
			return "FontFileBJigglish";
		case "Existence Light":
			return "FontFileExistence";
		case "HeartlandRegular":
			return "FontFileHeartland";
		case "Honey Script":
			return "FontFileHoney";
		case "I hate Comic Sans":
			return "FontFileIHate";
		case "loco tv":
			return "FontFileLocotv";
		case "Mail Ray Stuff":
			return "FontFileMailRay";
		case "Mia\'s Scribblings ~":
			return "FontFileMia";
		case "Coming Soon":
			return "FontFileCSoon";
		case "Lilita One":
			return "FontFileLOne";
		case "Telex Regular":
			return "FontFileTelex";
		case "":
		case null:
			return "";
		default:
			return `FontFile${font.replace(/\s/g, "")}`;
	}
}

/**
 * @param {ReadableStream} readStream 
 * @returns {Promise<Buffer>}
 */
function stream2Buffer(readStream) {
	return new Promise((res, rej) => {
		let buffers = [];
		readStream.on("data", (c) => buffers.push(c));
		readStream.on("end", () => res(Buffer.concat(buffers)));
	});
}

module.exports = {
	/**
	 * Parses a movie XML by adding files to a ZIP.
	 * @param {Buffer} xmlBuffer 
	 * @param {Buffer | null} thumbBuffer 
	 * @returns {Promise<Buffer>}
	 */
	async pack(xmlBuffer, thumbBuffer = null) {
		if (xmlBuffer.length == 0) throw null;

		const zip = nodezip.create();
		const themes = { common: true };
		var ugc = `${header}<theme id="ugc" name="ugc">`;
		fUtil.addToZip(zip, "movie.xml", xmlBuffer);

		// this is common in this file
		async function basicParse(file, type, subtype) {
			const pieces = file.split(".");
			const themeId = pieces[0];

			// add the extension to the last key
			const ext = pieces.pop();
			pieces[pieces.length - 1] += "." + ext;
			// add the type to the filename
			pieces.splice(1, 0, type);

			const filename = pieces.join(".");
			if (themeId == "ugc") {
				const id = pieces[2];
				try {
					console.log("is ugc");
					let buffer;
					if (type != "char") buffer = asset.load(id, true);

					// add asset meta
					if (type != "char") ugc += asset.meta2Xml(DB.get("assets", id).data);
					else ugc += char.parseUgcChar(pieces[3]);
					// and add the file
					if (buffer) fUtil.addToZip(zip, filename, buffer);

					// add video thumbnails
					if (type == "prop" && subtype == "video") {
						pieces[2] = pieces[2].slice(0, -3) + "png";
						const filename = pieces.join(".")
						const buffer = asset.load(pieces[2], true);
						fUtil.addToZip(zip, filename, buffer);
					}
				} catch (e) {
					console.error(`WARNING: ${id}:`, e);
					return;
				}
			} else {
				const filepath = `${store}/${pieces.join("/")}`;

				// add the file to the zip
				fUtil.addToZip(zip, filename, fs.readFileSync(filepath));
			}

			themes[themeId] = true;
		}

		// begin parsing the movie xml
		const film = new xmldoc.XmlDocument(xmlBuffer);
		for (const eI in film.children) {
			const elem = film.children[eI];

			switch (elem.name) {
				case "sound": {
					const file = elem.childNamed("sfile")?.val;
					if (!file) continue;

					await basicParse(file, elem.name)
					break;
				}

				case "scene": {
					for (const e2I in elem.children) {
						const elem2 = elem.children[e2I];

						let tag = elem2.name;
						// change the tag to the one in the store folder
						if (tag == "effectAsset") tag = "effect";

						switch (tag) {
							case "durationSetting":
							case "trans":
								break;
							case "bg":
							case "effect":
							case "prop": {
								const file = elem2.childNamed("file")?.val;
								if (!file) continue;

								await basicParse(file, tag, elem2.attr.subtype);
								break;
							}

							case "char": {
								let file = elem2.childNamed("action")?.val;
								if (!file) continue;
								const pieces = file.split(".");
								const themeId = pieces[0];

								const ext = pieces.pop();
								pieces[pieces.length - 1] += "." + ext;
								pieces.splice(1, 0, elem2.name);
								console.log(pieces[3]);
								if (themeId == "ugc" && !pieces[3].includes(".swf")) {
									// remove the action from the array
									pieces.splice(3, 1);

									const id = pieces[2];
									try {
										const buffer = await char.load(id);
										const filename = pieces.join(".");
										console.log(filename);

										ugc += asset.meta2Xml({
											// i can't just select the character data because of stock chars
											id: id,
											type: "char",
											themeId: char.getTheme(buffer)
										});
										fUtil.addToZip(zip, filename + ".xml", buffer);
										fUtil.addToZip(zip, filename + ".stand2.xml", Buffer.from(`<?xml version="1.0" encoding="utf-8"?><cc_char xscale='1' yscale='1' hxscale='1' hyscale='1' headdx='0' headdy='0'><color r="ccSkinColor" oc="0xFFE1C4">0xFFCE95</color><color r="ccEyeLib">0xFFCE95</color><color r="ccEyeIris">0x000000</color><color r="ccGlassesFrame">0xBE10B0</color><color r="ccGlassesLens">0x737373</color><color r="ccMouthLip">0x891258</color><color r="ccMustache">0x000000</color><color r="ccBeard">0xFFFFFF</color><color r="ccEyebrow">0x000000</color><color r="ccUpperMain" oc="0x336699">0xCC6600</color><color r="ccUpperMinor" oc="0xE5E5E5">0x0066FF</color><color r="ccLowerMain" oc="0xCCBC9A">0xCC9966</color><color r="ccLowerMinor" oc="0xEEEEEE">0xFFFFFF</color><color r="ccHairMajor">0x000000</color><component type="bodyshape" component_id="adam" theme_id="family" x="0" y="0" xscale="1" yscale="1" offset="0" rotation="0"/><component type="skeleton" component_id="adam_001" theme_id="family" x="0" y="0" xscale="1" yscale="1" offset="0" rotation="0"/><component type="hair" component_id="027" theme_id="family" x="-5" y="4" xscale="1.05" yscale="1.07" offset="0" rotation="0"/><component type="faceshape" component_id="012" theme_id="family" x="0" y="0" xscale="1" yscale="1" offset="0" rotation="0"/><component type="nose" component_id="019" theme_id="family" x="0" y="3" xscale="1" yscale="1" offset="0" rotation="0"/><component type="eyebrow" component_id="005" theme_id="family" x="0" y="0" xscale="1" yscale="1" offset="0" rotation="0"/><component type="upper_body" component_id="adam_001" theme_id="family" x="0" y="0" xscale="1" yscale="1" offset="0" rotation="0"/><component type="mouth" component_id="001" theme_id="family" x="0" y="1" xscale="1" yscale="1" offset="0" rotation="0"/><component type="eye" component_id="001" theme_id="family" x="0" y="1" xscale="1" yscale="1" offset="0" rotation="0"/><component type="ear" component_id="010" theme_id="family" x="0" y="0" xscale="1" yscale="1" offset="0" rotation="0"/><component type="lower_body" component_id="adam_001" theme_id="family" x="0" y="0" xscale="1" yscale="1" offset="0" rotation="0"/></cc_char>`));
										fUtil.addToZip(zip, pieces[0] + ".prop." + pieces[2] + ".head.head_neutral.xml", Buffer.from(`<cc_char xscale='1' yscale='1' hxscale='1' hyscale='1' headdx='0' headdy='0'>
																				<color r="ccSkinColor" oc="0xFFE1C4">0xFFCE95</color><color r="ccEyeLib">0xFFCE95</color><color r="ccEyeIris">0x000000</color><color r="ccGlassesFrame">0xBE10B0</color><color r="ccGlassesLens">0x737373</color><color r="ccMouthLip">0x891258</color><color r="ccMustache">0x000000</color><color r="ccBeard">0xFFFFFF</color><color r="ccEyebrow">0x000000</color><color r="ccUpperMain" oc="0x336699">0xCC6600</color><color r="ccUpperMinor" oc="0xE5E5E5">0x0066FF</color><color r="ccLowerMain" oc="0xCCBC9A">0xCC9966</color><color r="ccLowerMinor" oc="0xEEEEEE">0xFFFFFF</color><color r="ccHairMajor">0x000000</color>
																				<component type="bodyshape" theme_id="family" file="thumbnail.swf" path="adam" x="0" y="0" xscale="1" yscale="1" offset="0" rotation="0" /><component type="skeleton" theme_id="family" file="stand.swf" path="adam_001" x="0" y="0" xscale="1" yscale="1" offset="0" rotation="0" /><component type="hair" theme_id="family"  path="027" x="-5" y="4" xscale="1.05" yscale="1.07" offset="0" rotation="0" /><component type="faceshape" theme_id="family"  path="012" x="0" y="0" xscale="1" yscale="1" offset="0" rotation="0" /><component type="nose" theme_id="family"  path="019" x="0" y="3" xscale="1" yscale="1" offset="0" rotation="0" /><component type="eyebrow" theme_id="family" file="default.swf" path="005" x="0" y="0" xscale="1" yscale="1" offset="0" rotation="0" /><component type="upper_body" theme_id="family"  path="adam_001" x="0" y="0" xscale="1" yscale="1" offset="0" rotation="0" /><component type="mouth" theme_id="family" file="default.swf" path="001" x="0" y="1" xscale="1" yscale="1" offset="0" rotation="0" /><component type="eye" theme_id="family" file="default.swf" path="001" x="0" y="1" xscale="1" yscale="1" offset="0" rotation="0" /><component type="ear" theme_id="family"  path="010" x="0" y="0" xscale="1" yscale="1" offset="0" rotation="0" /><component type="lower_body" theme_id="family"  path="adam_001" x="0" y="0" xscale="1" yscale="1" offset="0" rotation="0" /></cc_char>`));
									} catch (e) {
										console.error(`WARNING: ${id}:`, e);
										continue;
									}
								} else if (themeId != "ugc") {
									const filepath = `${store}/${pieces.join("/")}`;
									const filename = pieces.join(".");

									fUtil.addToZip(zip, filename, fs.readFileSync(filepath));
								}
								else {
									console.log(pieces);
									let filepath = `${store}/Comm/char/${pieces[2]}/${pieces[3]}`;
									if (!fs.existsSync(filepath))
									{
									filepath = path.join(__dirname, "../../_ASSETS",pieces[3]);
									}
									const filename = pieces.join(".");

									fUtil.addToZip(zip, filename, fs.readFileSync(filepath));
									await basicParse(filename, "char");
								}

								for (const e3I in elem2.children) {
									const elem3 = elem2.children[e3I];
									if (!elem3.children) continue;

									// add props and head stuff
									file = elem3.childNamed("file")?.val;
									if (!file) continue;
									const pieces2 = file.split(".");

									// headgears and handhelds
									if (elem3.name != "head") {
										await basicParse(file, "prop");
									} else { // heads
										if (pieces2[0] == "ugc") continue;
										pieces2.pop(), pieces2.splice(1, 0, "char");
										const filepath = `${store}/${pieces2.join("/")}.swf`;

										pieces2.splice(1, 1, "prop");
										const filename = `${pieces2.join(".")}.swf`;
										fUtil.addToZip(zip, filename, fs.readFileSync(filepath));
									}

									themes[pieces2[0]] = true;
								}

								themes[themeId] = true;
								break;
							}

							case "bubbleAsset": {
								const bubble = elem2.childNamed("bubble");
								const text = bubble.childNamed("text");

								// arial doesn't need to be added
								if (text.attr.font == "Arial") continue;

								const filename = `${name2Font(text.attr.font)}.swf`;
								const filepath = `${source}/go/font/${filename}`;
								fUtil.addToZip(zip, filename, fs.readFileSync(filepath));
								break;
							}
						}
					}
					break;
				}
			}
		}

		if (themes.family) {
			delete themes.family;
			themes.custom = true;
		}

		if (themes.cc2) {
			delete themes.cc2;
			themes.action = true;
		}

		const themeKs = Object.keys(themes);
		themeKs.forEach((t) => {
			if (t == "ugc") return;
			const file = fs.readFileSync(`${store}/${t}/theme.xml`);
			fUtil.addToZip(zip, `${t}.xml`, file);
		});

		fUtil.addToZip(zip, "themelist.xml", Buffer.from(
			`${header}<themes>${themeKs.map((t) => `<theme>${t}</theme>`).join("")}</themes>`
		));
		fUtil.addToZip(zip, "ugc.xml", Buffer.from(ugc + "</theme>"));
		if (thumbBuffer) {
			fUtil.addToZip(zip, "thumbnail.png", thumbBuffer);
		}
		return await zip.zip();
	},

	/**
	 * unpacks a movie zip returns movie xml
	 * @param {Buffer} body 
	 * @returns {Promise<Buffer>}
	 */
	async unpack(body) {
		const zip = nodezip.unzip(body);
		const ugcStream = zip["ugc.xml"].toReadStream();
		const ugcBuffer = await stream2Buffer(ugcStream);
		const ugc = new xmldoc.XmlDocument(ugcBuffer);

		for (const eI in ugc.children) {
			const elem = ugc.children[eI];

			switch (elem.name) {
				case "background": {
					if (!asset.exists(elem.attr.id)) {
						const readStream = zip[`ugc.bg.${elem.attr.id}`].toReadStream();
						const buffer = await stream2Buffer(readStream);
						asset.save(buffer, elem.attr.id, {
							type: "bg",
							subtype: "0",
							title: elem.attr.name,
							id: "c55fb6c.swf"
						});
					}
					break;
				}

				case "prop": {
					if (!asset.exists(elem.attr.id)) {
						if (elem.attr.subtype == "video") {
							const readStream = zip[`ugc.prop.${elem.attr.id}`].toReadStream();
							const buffer = await stream2Buffer(readStream);
							asset.save(buffer, elem.attr.id, {
								type: "prop",
								subtype: "video",
								title: elem.attr.name,
								width: +elem.attr.width,
								height: +elem.attr.height,
								id: elem.attr.id
							});

							const readStream2 = zip[`ugc.prop.${elem.attr.id.slice(0, -4)}.png`].toReadStream();
							const buffer2 = await stream2Buffer(readStream2);
							fs.writeFileSync(path.join(
								__dirname,
								"../../",
								process.env.ASSET_FOLDER,
								elem.attr.id.slice(0, -4) + ".png"
							), buffer2);
						} else {
							const readStream = zip[`ugc.prop.${elem.attr.id}`].toReadStream();
							const buffer = await stream2Buffer(readStream);
							asset.save(buffer, elem.attr.id, {
								type: "prop",
								subtype: "0",
								title: elem.attr.name,
								ptype: elem.attr.wearable == 1 ? "wearable" :
									elem.attr.holdable == 1 ? "holdable" :
										"placeable",
								id: elem.attr.id
							});
						}
					}
					break;
				}

				case "char": {
					if (!char.exists(elem.attr.id)) {
						const readStream = zip[`ugc.char.${elem.attr.id}.xml`].toReadStream();
						const buffer = await stream2Buffer(readStream);
						char.save(buffer, {
							type: "char",
							subtype: 0,
							title: elem.attr.name,
							themeId: char.getTheme(buffer),
							id: elem.attr.id
						}, true);
					}
					break;
				}

				case "sound": {
					if (!asset.exists(elem.attr.id)) {
						const readStream = zip[`ugc.${elem.name}.${elem.attr.id}`].toReadStream();
						const buffer = await stream2Buffer(readStream);
						asset.save(buffer, elem.attr.id, {
							duration: +elem.attr.duration,
							type: elem.name,
							subtype: elem.attr.subtype,
							title: elem.attr.name,
							id: elem.attr.id
						});
					}
					break;
				}
			}
		}

		const readStream = zip["movie.xml"].toReadStream();
		const buffer = await stream2Buffer(readStream);

		let thumbBuffer = Buffer.from([0x00]);
		if (zip["thumbnail.png"]) {
			const readStream2 = zip["thumbnail.png"].toReadStream();
			thumbBuffer = await stream2Buffer(readStream2);
		}
		return [buffer, thumbBuffer];
	}
};