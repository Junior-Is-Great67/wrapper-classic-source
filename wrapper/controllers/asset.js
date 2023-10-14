/**
 * asset routes
 * NEW!!!
 */
// modules
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);
ffmpeg.setFfprobePath(require("@ffprobe-installer/ffprobe").path);
const { fromFile } = require("file-type");
const fs = require("fs");
const RC4 = require("simple-rc4")
const httpz = require("@octanuary/httpz");
const nodezip = require("node-zip");
const fUtil = require("../../utils/fileUtil");
const mime = require("mime-types");
const processVoice = require("../models/tts");
const path = require("path");
const tempfile = require("tempfile");
// vars
const fileTypes = require("../data/fileTypes.json");
const header = process.env.XML_HEADER;
const folder = path.join(__dirname, "../../", process.env.ASSET_FOLDER);
const dfolder = path.join(__dirname, "../../", "wrapper/data");
const savedfolder = path.join(__dirname, "../../", process.env.SAVED_FOLDER);
const sFolder = path.join(__dirname, "../../server", process.env.STORE_URL);
const commFolder = path.join(__dirname, "../../server", process.env.STORE_URL, "/Comm");
const thumbUrl = process.env.THUMB_BASE_URL;
// stuff
const Asset = require("../models/asset");
const database = require("../../data/database"), DB = new database();
const rFileUtil = require("../../utils/realFileUtil");
const fold = path.join(__dirname, "../../", "_ASSETS");
const base = Buffer.alloc(1, 0);
//Combining text to speech in here for.. you know
const info = require("../data/voices");
const voices = info.voices, langs = {};
Object.keys(voices).forEach((i) => {
	const v = voices[i], l = v.language;
	langs[l] = langs[l] || [];
	langs[l].push(`<voice id="${i}" desc="${v.desc}" sex="${v.gender}" demo-url="" country="${v.country}" plus="N"/>`);
});
const http = require("http");
let di;
let first = false;
let dafourty;
let checkcode = 0;
let offset = 1;
let off;
let ofn;
// create the group
const group = new httpz.Group();
function makeTheComponentsGoAllInAnArrayThatIsFormattedLikeThe2010LVMSupports(component, theme) {
	let seperator = [];
	let arrary = [];
	for (let i = 0; i < component.length; i++) {
		for (let a = 0; a < component[i].length; a++) {
			arrary.push(`${component[i][a]._attributes.theme_id}.${component[i][a]._attributes.type}.${component[i][a]._attributes.component_id}.swf`)
		}
		seperator.push(arrary);
		arrary = [];
	}
	//Bully me guys i used chat gpt i was too lazy to write a whole request
	const http = require('http');
	const postData = JSON.stringify({
		array: seperator,
		themeid: theme
	});

	const options = {
		hostname: 'localhost',
		port: '4343',
		path: '/getCharSwfPartsForThe2010LvmRightFreakingNow',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': postData.length
		}
	};
	const request = http.request(options, (response) => {
		response.on('end', () => {
			console.log('Parts are..');
		});
	});
	request.on('error', (error) => {
		console.error('PARTS ARE ERRORING:', error);
	});
	request.write(postData);
	request.end();
	return arrary;
}
function get(url, options = {}) {
	var data = [];
	return new Promise((res, rej) => {
		http.get(url, options, (o) => {
			o.on("data", (v) => data.push(v)).on("end", () => res(Buffer.concat(data))).on("error", rej)
		});
	});
};
var escapable = /[\\\"\x00-\x1f\x7f-\uffff]/g,
	meta = {    // table of character substitutions
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\f': '\\f',
		'\r': '\\r',
		'"': '\\"',
		'\\': '\\\\'
	};

function quote(string) {

	// If the string contains no control characters, no quote characters, and no
	// backslash characters, then we can safely slap some quotes around it.
	// Otherwise we must also replace the offending characters with safe escape
	// sequences.

	escapable.lastIndex = 0;
	return escapable.test(string) ?
		'"' + string.replace(escapable, function (a) {
			var c = meta[a];
			return typeof c === 'string' ? c :
				'\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
		}) + '"' :
		'"' + string + '"';
}
function listAssets(filters, ttsfilter = false) {
	let files;
	if (ttsfilter) {
		files = DB.ttsselect("assets", filters);
	}
	else {
		files = DB.select("assets", filters);
	}
	return `${header}<theme id="ugc">${files.map(Asset.meta2Xml).join("")}</theme>`;
}
function listOldChars(filters) {
	let files;
	files = DB.select("assets", filters);
	return `${files.map(Asset.oldMeta2Xml).join("")}`;
}
function listTemplateAssets(filters,) {
	let files;
	files = DB.select("assets", filters);
	return `${header}<theme id="ugc">${files.map(Asset.meta2StareXml).join("")}</theme>`;
}
function listTeamAssets(filters) {
	const files = DB.select("teamassets", filters);
	return `${header}<ugc more="0">${files.map(Asset.meta20Xml).join("")}</ugc>`;
}
/*{
			const id = req.body.assetId;
			res.assert(id, 400, "Missing one or more fields.");

			try {
				const readStream = Asset.load(id);
				res.setHeader("Content-Type", mime.contentType(id));
				readStream.pipe(res);
				/*
				const file = Asset.load(id);
				const zip = nodezip.create();
				fUtil.addToZip(zip, id, path.join(folder, id));
				res.end(await zip.zip());
			} catch (e) {
				console.log("Error loading asset:", e);
				res.status(404).end();
			}
		}*/
function oldlistAssets() {
	return `<char id="193e57f" name="Test David" cc_theme_id="family" thumbnail_url="http://localhost:4343/thumb_store/193e57f.png" copyable="Y"><tags/></char>`;
}
group
	// delete
	.route("GET", "/old_full", async (req, res) => {
		offset = 1;
		daforuty = 0;
		off = 0;
	})
	.route("GET", "/go_full", async (req, res) => {
		first = true;
		console.log(first);
	})
	.route("GET", "/api/listCharJson/", (req, res) => {
		let themeId = "family";
		const filters = {
			themeId,
			type: "char"
		};
		let files = DB.select("assets", filters);
		res.json(files);
	})
	.route("POST", "/ajax/getCCCharacters", (req, res) => {
		let themeId = "family";
		let response = [];
		const filters = {
			themeId,
			type: "char"
		};
		let files = DB.select("assets", filters);
		// Reconstruct the cc list
		for (const v of files) {
			response.push({ "id": v.id, "thumb_url": `assets/${v.id}.png`, "head_url": `assets/head/${v.id}.png` });
		}
		res.json(response);
	})
	.route("GET", "/api/pimouth/", (req, res) => {
		const myname = path.join(sFolder, "cc_store/family");
		let char;
		let part;
		fs.readdirSync(myname).forEach(charFolder => {
			char = charFolder;
			if (charFolder != "cc_theme.xml" && charFolder != "emotions") {
				fs.readdirSync(path.join(myname, char)).forEach(partFolder => {
					part = partFolder;
					if (!partFolder.includes("zip") && partFolder != ".DS_Store") {
						fs.readdirSync(path.join(myname, char, part)).forEach(swf => {
							if (charFolder == "mouth" || charFolder == "eyebrow" || charFolder == "eye") {
								if (swf.includes(".")) {
									let expression = swf.slice(0, -4);
									if (!fs.existsSync(path.join(myname, char, part, expression))) fs.mkdirSync(path.join(myname, char, part, expression));
									let theswf = fs.readFileSync(path.join(myname, char, part, swf));
									fs.writeFileSync(path.join(myname, char, part, expression, "default.swf"), theswf)
									if (charFolder == "mouth" && swf.includes("talk") && !swf.includes("sync") && swf != "talk.swf" && !swf.includes("a.swf") && !swf.includes("b.swf") && !swf.includes("a_sync.swf") && !swf.includes("b_sync.swf")) {
										let express = swf.slice(5, -4);
										console.log(express);
										let thetalkswf = fs.readFileSync(path.join(myname, char, part, swf));
										fs.writeFileSync(path.join(myname, char, part, express, "talk.swf"), thetalkswf);
									}
									else if (part == "mouth" && swf.includes("sync") && swf != "talk.swf" && !swf.includes("a.swf") && !swf.includes("b.swf") && !swf.includes("a_sync.swf") && !swf.includes("b_sync.swf")) {
										let express = swf.slice(5, -4);
										console.log(express);
										let thetalksyncswf = fs.readFileSync(path.join(myname, char, part, swf));
										fs.writeFileSync(path.join(myname, char, part, express, "talk_sync.swf"), thetalksyncswf);
									}
								}
							}
						});
					}
				});
			}
		});
	})
	.route("POST", "/api/convert/customassets/", (req, res) => {
		const themeId = req.body.themeId;
		const myname = path.join(sFolder, "cc_store/" + themeId);
		let char;
		let part;
		let isCustomAssets = false;
		if (fs.existsSync(path.join(myname, "custom"))) {
			isCustomAssets = true;
		}
		let swift;
		fs.readdirSync(myname).forEach(charFolder => {
			char = charFolder;
			if (charFolder == "custom") {
				isCustomAssets = true;
			}
			if (charFolder != "cc_theme.xml" && charFolder != "emotions" && !charFolder.includes(".") && charFolder != "custom") {
				fs.readdirSync(path.join(myname, char)).forEach(partFolder => {
					part = partFolder;
					if (!partFolder.includes("zip") && partFolder != ".DS_Store") {
						if (!partFolder.includes(".swf")) {
							fs.readdirSync(path.join(myname, char, part)).forEach(swf => {
								if (swf.includes(".") && !swf.includes("fla") & !swf.includes("as")) {
									let buffer = new Buffer.from(fs.readFileSync(path.join(myname, char, part, swf)));
									if (!isCustomAssets) {
										var rc3 = new RC4(`sorrypleasetryagainlater`);
										rc3.update(buffer);
									}
									var rc4 = new RC4(`g0o1a2n3i4m5a6t7e`);
									rc4.update(buffer);
									fs.writeFileSync(path.join(myname, char, part, swf), buffer, 'utf8');
								}
							});
						}
						else {
							if (partFolder.includes(".") && !partFolder.includes("fla") & !partFolder.includes("as")) {
								let buffer = new Buffer.from(fs.readFileSync(path.join(myname, char, part)));
								if (!isCustomAssets) {
									var rc3 = new RC4(`sorrypleasetryagainlater`);
									rc3.update(buffer);
								}
								var rc4 = new RC4(`g0o1a2n3i4m5a6t7e`);
								rc4.update(buffer);
								fs.writeFileSync(path.join(myname, char, part), buffer, 'utf8');
							}
						}
					}
				});
			}
		});
		res.json({ status: "ok", success: true });
	})
	.route("POST", "/api_v2/asset/delete/", (req, res) => {
		const id = req.body.data.id || req.body.data.starter_id;
		res.assert(id, 400, { status: "error" });

		try {
			DB.delete("assets", id);
			res.json({ status: "ok" });
		} catch (e) {
			console.log("Error deleting asset:", e);
			res.statusCode = 404;
			res.json({ status: "error" });
		}
	})

	.route("POST", "/goapi/deleteAsset/", (req, res) => {
		const id = req.body.assetId;
		res.assert(id, 400, { status: "error" });
		let charid;
		try {
			if (req.body.actionId) {
				let files = DB.select("assets", { type: "charugc" });
				for (const v of files) {
					if (v.idarray.indexOf(req.body.actionId) != -1) {
						charid = v.id;
						let index = v.idarray.indexOf(req.body.actionId);
						if (index > -1) {
							v.idarray.splice(index, 1);
							v.actionnames.splice(index, 1);
						}
						DB.update("assets", charid, v);
						break;
					}
				}
			}
			else DB.delete("assets", id);
			res.end("0");
		} catch (e) {
			console.log("Error deleting asset:", e);
			res.statusCode = 404;
			res.end("1");
		}
	})
	.route("POST", "/goapi/jpg_download/", (req, res) => {
		res.assert(req.body.imagedata, 400, { status: "ghkljhgjkojhghjk" });
		const image = Buffer.from(req.body.imagedata, "base64");
		res.end(image);
	})
	//List for the old goanimate
	/*.route("POST", "/goapi/getUserAssets/", async (req, res) => {
			const zip = nodezip.create();
			fUtil.addToZip(zip, "desc.xml", Buffer.from(listAssets(req.body)));
			res.setHeader("Content-Type", "application/zip");
			res.write(base);
			res.end(await zip.zip());
	})*/
	.route("POST", "/goapi/getCommunityData/", async (req, res) => {
		res.json([{ "name": "david.png", "mId": "m-5635", "id": "david.png", "subtype": "bg" }, { "name": "m-5641.07297674807933063-prop.png", "mId": "m-5641", "id": "07297674807933063-prop.png", "subtype": "prop" }]);
	})
	.route("POST", "/api_v2/assets/team", async (req, res) => {
		res.assert(req.body.data.type, 400, { status: "error" });
		if (req.body.data.type == "prop") req.body.data.subtype ||= 0;

		res.json({
			status: "ok",
			data: {
				xml: listTeamAssets(req.body.data)
			}
		});
	})

	.route("GET", "/goapi/testZip/", async (req, res) => {
		const zip = nodezip.create();
		fUtil.addToZip(zip, "desc.xml", Buffer.from(listAssets(req.body)));
		res.setHeader("Content-Type", "application/zip");
		res.write(base);
		res.end(await zip.zip());
	})
	.route("POST", "/goapi/searchCommunityAssets/", async (req, res) => {
		const meta = DB.select("comm", req.body.type);
		let lar = 0;
		for (const v of meta) {
			if (v.title.toLowerCase().includes(req.body.keywords.toLowerCase()) && v.type == req.body.type) lar++;
		}
		var tXml = `<theme id="ugc" name="Community Library" all_asset_count="${lar}">`;
		for (const v of meta) {
			if (v.title.toLowerCase().includes(req.body.keywords.toLowerCase())) tXml += Asset.meta2StareXml(v);
		}
		console.log(tXml)
		const zip = nodezip.create();
		fUtil.addToZip(zip, "desc.xml", tXml + "</theme>");
		for (const file of meta) {
			if (file.title.toLowerCase().includes(req.body.keywords.toLowerCase())) {
				const buffer = Asset.load(file.id, true);
				fUtil.addToZip(zip, `${file.type}/${file.id}`, buffer);
			}
		}
		res.setHeader("Content-Type", "application/zip");
		res.end(Buffer.concat([base, await zip.zip()]));
	})
	.route("POST", "/api_v2/assets/imported", async (req, res) => {
		res.assert(req.body.data.type, 400, { status: "error" });
		if (req.body.data.type == "prop") req.body.data.subtype ||= 0;

		res.json({
			status: "ok",
			data: {
				xml: listAssets(req.body.data)
			}
		});
	})
	.route("GET", "/api/saveFont", async (req, res) => {
		const textToImage = require('text-to-image');
		textToImage.generate('Pizza Tower', {
			debug: true,
			maxWidth: 720,
			fontSize: 18,
			fontFamily: '/Users/jaxsonhendrix/PizzaTower.ttf',
			lineHeight: 30,
			margin: 5,
			bgColor: 'white',
			textColor: 'black',
		}).then(function (dataUri) {
			// use the dataUri
			const buffer = Buffer.from(dataUri, "base64");
			fs.writeFileSync("./buffer.png", buffer);
		});
		res.json({ status: "ok" });
	})
	.route("POST", "/goapi/getUserFontList/", async (req, res) => {
		res.json({
			status: "ok",
			result: [{
				"id": "123",
				"aid": "FontFileCustom123",
				"title": "pizza",
				"fontPath": "font/FontFileCustom123.swf",
				"listImage": "font/FontFileCustom123_tray.png",
				"tags": [],
				"label": "FontFileCustom123",
				"trayImage": "font/FontFileCustom123.png"
			}]
		});
	})
	.route("GET", "/goapi/getAssetTags", async (req, res) => {
		res.setHeader("Content-Type", "application/json");
		res.end(`0{data: {
			  "prop": {
				"business": {
				  "tags": ["rusty", "pattern", "street"]
				}
			  }
			}
		  }`);
	})
	// list
	.route("*", "/goapi/getUserVideoAssets/", async (req, res) => {
		const zip = nodezip.create();
		const filters = {
			type: "prop"
		};
		let xml;
		const filez = DB.select("assets", filters);
		for (const file of filez) {
			console.log(file.subtype);
			if (file.subtype == "video") {
				xml += Asset.meta2VideoXml(file);
			}
		}
		fUtil.addToZip(zip, "desc.xml", Buffer.from(`<theme id="ugc">${xml.substring(9)}</theme>`));
		const files = DB.select("assets", filters);
		for (const asset of files) {
			if (asset.subtype == "video") {
				const buffer = Asset.load(asset.id, true);
				let filepath = `${asset.type}/${asset.id}`;
				fUtil.addToZip(zip, filepath, buffer);
				const thumbnailPath = path.join(__dirname, "../../_ASSETS", asset.id.slice(0, -3) + "png");
				const thumbnail = fs.readFileSync(thumbnailPath);
				fUtil.addToZip(zip, `${asset.type}/${asset.id.slice(0, -3) + "png"}`, thumbnail);
			}
		}
		res.setHeader("Content-Type", "application/zip");
		zip.zip().then((b) => res.end(Buffer.concat([Buffer.from([0x0]), b])));
	})
	.route("*", "/goapi/getUserAssets/", async (req, res) => {
		const zip = nodezip.create();
		let render = 41;
		let ogpage = req.body.page;
		let newpage = parseInt(ogpage);
		let page = newpage + 1;
		let off2;
		if (req.body.type == "prop") {
			if (page == 2) {
				off = 40;
				off2 = off + 40;
			}
			else if (page > 2) {
				off += 40;
				off2 = off + 40;
			}
		}
		if (req.method == "POST") {
			if (req.body.is_cc || req.body.cc_theme_id) {
				if (req.body.v != "2010") {
					Asset.checkV(req.body.v);
					let themeId = req.body.cc_theme_id;
					if (req.body.cc_theme_id == "") themeId = "cctoonadventure";
					const filters = {
						themeId,
						type: "char"
					};
					let xml = `<theme id="ugc" >${listOldChars(filters)}</theme>`;
					const files = DB.select("assets", filters);
					for (const file of files) {
						if (fs.existsSync(path.join(fold, file.id + ".png"))) {
							fUtil.addToZip(zip, `char/${file.id}/${file.id}.png`, fs.readFileSync(path.join(fold, file.id + ".png")));
						}
					}
					fUtil.addToZip(zip, "desc.xml", Buffer.from(xml));
				}
				else {
					Asset.checkV("2010");
					let cc_theme = "";
					if (req.body.cc_theme_id == "custom") {
						cc_theme = "family";
					}
					else if (req.body.cc_theme_id == "toonadv") {
						cc_theme = "cctoonadventure";
					}
					else if (req.body.cc_theme_id == "action") {
						cc_theme = "cc2";
					}
					console.log("cc theme id is", cc_theme)
					var convert = require('xml-js');
					const filters = {
						themeId: cc_theme,
						type: "char"
					};
					let componentarray = [];
					let num = 0;
					let desc = "";
					const files = DB.select("assets", filters);
					const Char = require("../models/char");
					for (const file of files) {
						const buf = await Char.load(file.id);
						desc += Asset.oldMeta2Xml(file);
						let result = convert.xml2json(buf.toString(), { compact: true, spaces: 4 });
						const realresult = JSON.parse(result);
						componentarray.push(realresult.cc_char.component);
						//if (num == 100) break; 
						num++
					}
					makeTheComponentsGoAllInAnArrayThatIsFormattedLikeThe2010LVMSupports(componentarray, cc_theme);
					num = 0;
					for (const file of files) {
						if (fs.existsSync(path.join(fold, file.id + ".png"))) {
							fUtil.addToZip(zip, `char/${file.id}/${file.id}.png`, fs.readFileSync(path.join(fold, file.id + ".png")));
						}
						//if (num == 100) break; 
						num++
					}
					fUtil.addToZip(zip, "desc.xml", Buffer.from(`<ugc id="ugc" name="ugc" more="0" moreChar="0">${desc}</ugc>`));
				}
			}
			else {
				let jason;
				if (req.body.type != "char") {
					jason = { "type": req.body.type, "count": "48", "page": req.body.page };
					if (req.body.type == "sound") {
						let xml;
						const files = DB.select("assets", jason);
						for (const file of files) {
							console.log(file.subtype);
							if (file.subtype != "tts") {
								xml += Asset.meta2Xml(file);
							}
							switch (file.type) {
								case "char": {
									const buffer = fs.readFileSync(path.join(folder, `${file.id}.xml`));
									const thumbBuffer = fs.readFileSync(path.join(folder, `${file.id}.png`));
									fUtil.addToZip(zip, `char/${file.id}/${file.id}.xml`, buffer);
									fUtil.addToZip(zip, `char/${file.id}/${file.id}.png`, thumbBuffer);
									break;
								} default: {
									if (req.body.type == "movie" && file.type == "movie") {
										const xmlPath = path.join(__dirname, "../../_SAVED", file.id + ".xml");
										const thumbPath = path.join(__dirname, "../../_SAVED", file.id + ".png");
										const xml = fs.readFileSync(xmlPath);
										const thumb = fs.readFileSync(thumbPath);

										const pathBase = `movie/${file.id}`;
										fUtil.addToZip(zip, pathBase + ".xml", xml);
										fUtil.addToZip(zip, pathBase + ".png", thumb);
									}
									else if (req.body.subtype != "video" && file.subtype != "tts") {
										const buffer = Asset.load(file.id, true);
										fUtil.addToZip(zip, `${file.type}/${file.id}`, buffer);
									}
									else {
										if (file.subtype == "video") {
											const buffer = Asset.load(file.id, true);
											fUtil.addToZip(zip, `${file.type}/${file.id}`, buffer);
											const thumbnailPath = path.join(__dirname, "../../_ASSETS", file.id.slice(0, -3) + "png");
											const thumbnail = fs.readFileSync(thumbnailPath);
											fUtil.addToZip(zip, `${file.type}/${file.id.slice(0, -3) + "png"}`, thumbnail);
										}
									}
								}
							}
						}
						if (xml == undefined) fUtil.addToZip(zip, "desc.xml", Buffer.from(`<theme id="ugc" moreBg="0">${xml}</theme>`));
						else fUtil.addToZip(zip, "desc.xml", Buffer.from(`<theme id="ugc" moreBg="0">${xml.substring(9)}</theme>`));
					}
					else if (req.body.type == "bg") {
						const files = DB.select("assets", jason);
						for (const file of files) {
							switch (file.type) {
								case "char": {
									const buffer = fs.readFileSync(path.join(folder, `${file.id}.xml`));
									const thumbBuffer = fs.readFileSync(path.join(folder, `${file.id}.png`));
									fUtil.addToZip(zip, `char/${file.id}/${file.id}.xml`, buffer);
									fUtil.addToZip(zip, `char/${file.id}/${file.id}.png`, thumbBuffer);
									break;
								} default: {
									if (req.body.type == "movie" && file.type == "movie") {
										const xmlPath = path.join(__dirname, "../../_SAVED", file.id + ".xml");
										const thumbPath = path.join(__dirname, "../../_SAVED", file.id + ".png");
										const xml = fs.readFileSync(xmlPath);
										const thumb = fs.readFileSync(thumbPath);

										const pathBase = `movie/${file.id}`;
										fUtil.addToZip(zip, pathBase + ".xml", xml);
										fUtil.addToZip(zip, pathBase + ".png", thumb);
									}
									else if (req.body.subtype != "video" && file.subtype != "tts") {
										console.log(file.id);
										const buffer = Asset.load(file.id, true);
										fUtil.addToZip(zip, `${file.type}/${file.id}`, buffer);
									}
									else {
										if (file.subtype == "video") {
											const buffer = Asset.load(file.id, true);
											fUtil.addToZip(zip, `${file.type}/${file.id}`, buffer);
											const thumbnailPath = path.join(__dirname, "../../_ASSETS", file.id.slice(0, -3) + "png");
											const thumbnail = fs.readFileSync(thumbnailPath);
											fUtil.addToZip(zip, `${file.type}/${file.id.slice(0, -3) + "png"}`, thumbnail);
										}
									}
								}
							}
						}
						fUtil.addToZip(zip, "desc.xml", Buffer.from(listAssets(jason)));
					}
					else if (req.body.subtype == "video") {
						jason = { "type": "prop", "count": "48", "page": req.body.page };
						let xml;
						const files = DB.select("assets", jason);
						for (const file of files) {
							console.log(file.subtype);
							if (file.subtype == "video") {
								xml += Asset.meta2VideoXml(file);
							}
							switch (file.type) {
								case "char": {
									const buffer = fs.readFileSync(path.join(folder, `${file.id}.xml`));
									const thumbBuffer = fs.readFileSync(path.join(folder, `${file.id}.png`));
									fUtil.addToZip(zip, `char/${file.id}/${file.id}.xml`, buffer);
									fUtil.addToZip(zip, `char/${file.id}/${file.id}.png`, thumbBuffer);
									break;
								} default: {
									if (req.body.type == "movie" && file.type == "movie") {
										const xmlPath = path.join(__dirname, "../../_SAVED", file.id + ".xml");
										const thumbPath = path.join(__dirname, "../../_SAVED", file.id + ".png");
										const xml = fs.readFileSync(xmlPath);
										const thumb = fs.readFileSync(thumbPath);

										const pathBase = `movie/${file.id}`;
										fUtil.addToZip(zip, pathBase + ".xml", xml);
										fUtil.addToZip(zip, pathBase + ".png", thumb);
									}
									else if (req.body.subtype != "video" && file.subtype != "tts") {
										const buffer = Asset.load(file.id, true);
										fUtil.addToZip(zip, `${file.type}/${file.id}`, buffer);
									}
									else {
										if (file.subtype == "video") {
											const buffer = Asset.load(file.id, true);
											fUtil.addToZip(zip, `${file.type}/${file.id}`, buffer);
											const thumbnailPath = path.join(__dirname, "../../_ASSETS", file.id.slice(0, -3) + "png");
											const thumbnail = fs.readFileSync(thumbnailPath);
											fUtil.addToZip(zip, `${file.type}/${file.id.slice(0, -3) + "png"}`, thumbnail);
										}
									}
								}
							}
						}
						if (xml == undefined) fUtil.addToZip(zip, "desc.xml", Buffer.from(`<theme id="ugc">${xml}</theme>`));
						else fUtil.addToZip(zip, "desc.xml", Buffer.from(`<theme id="ugc">${xml.substring(9)}</theme>`));
					}
					else if (req.body.type == "prop" && !req.body.subtype) {
						//This is the inifite scroller page code
						//Really hard because I have to manually make pages
						const files = DB.select("assets", jason);
						let pop;
						let nexties = 0;
						console.log("page is:" + page);
						let poop = 0;
						let curamount = 0;
						for (const v of files) {
							if (poop < render && page == 1) {
								if (v.subtype != "video") {
									pop += Asset.meta2Xml(v);
									curamount++;
									console.log(curamount);
								}
							}
							else if (off < poop && poop < off2 + 1 && page > 1) {
								if (v.subtype != "video") {
									pop += Asset.meta2Xml(v);
									console.log("The stuff is in the nexty page besti");
								}
								nexties++;
							}
							switch (v.type) {
								case "char": {
									const buffer = fs.readFileSync(path.join(folder, `${file.id}.xml`));
									const thumbBuffer = fs.readFileSync(path.join(folder, `${v.id}.png`));
									fUtil.addToZip(zip, `char/${v.id}/${v.id}.xml`, buffer);
									fUtil.addToZip(zip, `char/${v.id}/${v.id}.png`, thumbBuffer);
									break;
								} default: {
									if (req.body.type == "movie" && v.type == "movie") {
										const xmlPath = path.join(__dirname, "../../_SAVED", v.id + ".xml");
										const thumbPath = path.join(__dirname, "../../_SAVED", v.id + ".png");
										const xml = fs.readFileSync(xmlPath);
										const thumb = fs.readFileSync(thumbPath);

										const pathBase = `movie/${v.id}`;
										fUtil.addToZip(zip, pathBase + ".xml", xml);
										fUtil.addToZip(zip, pathBase + ".png", thumb);
									}
									else if (req.body.subtype != "video" && v.subtype != "tts") {
										const buffer = Asset.load(v.id, true);
										fUtil.addToZip(zip, `${v.type}/${v.id}`, buffer);
									}
									else {
										if (v.subtype == "video") {
											const buffer = Asset.load(v.id, true);
											fUtil.addToZip(zip, `${v.type}/${v.id}`, buffer);
											const thumbnailPath = path.join(__dirname, "../../_ASSETS", v.id.slice(0, -3) + "png");
											const thumbnail = fs.readFileSync(thumbnailPath);
											fUtil.addToZip(zip, `${v.type}/${v.id.slice(0, -3) + "png"}`, thumbnail);
										}
									}
								}
							}
							if (v.subtype != "video") poop++;
						}
						console.log(poop);
						console.log("who made it to the next page?" + nexties);
						offset++;
						if (pop === undefined) {
							fUtil.addToZip(zip, "desc.xml", Buffer.from(`<theme id="ugc" moreProp="0"></theme>`));
						}
						else {
							fUtil.addToZip(zip, "desc.xml", Buffer.from(`<theme id="ugc" moreProp="1">${pop.substring(9)}</theme>`));
						}
						console.log(`<theme id="ugc" moreProp="1">${pop}</theme>`);
					}
					else {
						const files = DB.select("assets", jason);
						fUtil.addToZip(zip, "desc.xml", Buffer.from(listTemplateAssets(jason)));
						for (const file of files) {
							switch (file.type) {
								case "char": {
									const buffer = fs.readFileSync(path.join(folder, `${file.id}.xml`));
									const thumbBuffer = fs.readFileSync(path.join(folder, `${file.id}.png`));
									fUtil.addToZip(zip, `char/${file.id}/${file.id}.xml`, buffer);
									fUtil.addToZip(zip, `char/${file.id}/${file.id}.png`, thumbBuffer);
									break;
								} default: {
									if (req.body.type == "movie" && file.type == "movie") {
										const xmlPath = path.join(__dirname, "../../_SAVED", file.id + ".xml");
										const thumbPath = path.join(__dirname, "../../_SAVED", file.id + ".png");
										const xml = fs.readFileSync(xmlPath);
										const thumb = fs.readFileSync(thumbPath);

										const pathBase = `movie/${file.id}`;
										fUtil.addToZip(zip, pathBase + ".xml", xml);
										fUtil.addToZip(zip, pathBase + ".png", thumb);
									}
									else if (req.body.subtype != "video" && file.subtype != "tts") {
										console.log(file.id);
										const buffer = Asset.load(file.id, true);
										fUtil.addToZip(zip, `${file.type}/${file.id}`, buffer);
									}
									else {
										if (file.subtype == "video") {
											const buffer = Asset.load(file.id, true);
											fUtil.addToZip(zip, `${file.type}/${file.id}`, buffer);
											const thumbnailPath = path.join(__dirname, "../../_ASSETS", file.id.slice(0, -3) + "png");
											const thumbnail = fs.readFileSync(thumbnailPath);
											fUtil.addToZip(zip, `${file.type}/${file.id.slice(0, -3) + "png"}`, thumbnail);
										}
									}
								}
							}
						}
					}
				}
				else {
					const files = DB.select("assets", { type: "charugc" });
					let xmlMeta = `<theme id="ugc">`;
					for (const v of files) {
						xmlMeta += `<char id="${v.id}" name="${v.title}" published="1" facing="left" thumb="${v.defaultaid}.swf" default="${v.defaultaid}.swf">`;
						for (var b = 0; b < v.idarray.length; b++) {
							xmlMeta += `<action id="${v.idarray[b]}.swf" name="${v.actionnames[b]}"/>`;
							const buffer = fs.readFileSync(path.join(__dirname, "../../_ASSETS", v.idarray[b] + ".swf"));
							fUtil.addToZip(zip, `char/${v.id}/${v.idarray[b]}.swf`, buffer);
						}
						xmlMeta += `</char>`;
					}
					xmlMeta += `</theme>`;
					fUtil.addToZip(zip, "desc.xml", Buffer.from(xmlMeta));
					console.log("xml", xmlMeta);

				}
			}
			res.setHeader("Content-Type", "application/zip");
			zip.zip().then((b) => res.end(Buffer.concat([Buffer.from([0x0]), b])));
		}
		else {
			let jason;
			jason = { "type": "prop", "count": "9000", "page": "0" };
			fUtil.addToZip(zip, "desc.xml", Buffer.from(listAssets(jason)));
			console.log("page is:" + page);
			const files = DB.select("assets", jason);
			console.log(files);
		}
	})
	.route("POST", "/goapi/getCommunityAssets/", async (req, res) => {

		const zip = nodezip.create();
		let isProp;
		if (req.body.type == "prop") {
			isProp = true;
		}
		else {
			isProp = false;
		}
		let xmltext = isProp ? "moreProp" : "moreBG";
		console.log(xmltext);
		var tXml = `<theme id="ugc" name="Community Library" ${xmltext}="1">`;
		const jason = { "type": req.body.type, "count": req.body.count, "page": req.body.page };
		fUtil.addToZip(zip, "desc.xml", Buffer.from(tXml));
		if (req.body.type == "prop") {
			const meta = DB.select("comm", "prop");
			let render = 41;
			let ogpage = req.body.page;
			let newpage = parseInt(ogpage);
			let page = newpage + 1;
			let off2;
			if (req.body.type == "prop") {
				if (page == 2) {
					ofn = 40;
					off2 = ofn + 40;
				}
				else if (page > 2) {
					ofn += 40;
					off2 = ofn + 40;
				}
			}
			//This is the COMMUNITY inifite scroller page code
			//Even tougher because its fetching comm stuff and it isnt filtering anything out
			const files = DB.select("comm", "prop");
			let pop;
			let nexties = 0;
			console.log("page is:" + page);
			let poop = 0;
			let curamount = 0;
			for (const v of files) {
				if (poop < render && page == 1) {
					if (v.type == req.body.type) pop += Asset.meta2StareXml(v);
					curamount++;
					console.log(curamount);
				}
				else if (ofn < poop && poop < off2 + 1 && page > 1) {
					if (v.type == req.body.type) pop += Asset.meta2StareXml(v);
					console.log("The stuff is in the nexty page besti");
					nexties++;
				}
				console.log(poop < render);
				if (v.type == req.body.type) poop++;
			}
			console.log(poop);
			console.log("who made it to the next page?" + nexties);
			offset++;
			if (pop === undefined) {
				fUtil.addToZip(zip, "desc.xml", Buffer.from(`<theme id="ugc" moreProp="0"></theme>`));
			}
			else {
				fUtil.addToZip(zip, "desc.xml", Buffer.from(`<theme id="ugc" moreProp="1">${pop.substring(9)}</theme>`));
			}
			console.log(`<theme id="ugc" moreProp="1">${pop}</theme>`);
			for (const file of meta) {
				const buffer = Asset.load(file.id, true);
				fUtil.addToZip(zip, `${file.type}/${file.id}`, buffer);
			}
			res.setHeader("Content-Type", "application/zip");
			res.write(base);
			res.end(await zip.zip());
		}
		else if (req.body.type == "bg") {
			const meta = DB.select("comm", "prop");
			var tXml = `<theme id="ugc" name="Community Library" ${xmltext}="1">`;
			for (const v of meta) {
				if (v.type == req.body.type) tXml += Asset.meta2StareXml(v);
			}
			tXml += "</theme>"
			const jason = { "type": req.body.type, "count": req.body.count, "page": req.body.page };
			fUtil.addToZip(zip, "desc.xml", Buffer.from(tXml));
			const files = DB.select("comm", jason);
			for (const file of files) {
				switch (file.type) {
					case "char": {
						const buffer = fs.readFileSync(path.join(commFolder, `${file.id}.xml`));
						const thumbBuffer = fs.readFileSync(path.join(commFolder, file.type, `${file.id}.png`));
						fUtil.addToZip(zip, `${file.id}.xml`, buffer);
						fUtil.addToZip(zip, `${file.id}.png`, thumbBuffer);
						break;
					} default: {
						const buffer = Asset.load(file.id, true);
						fUtil.addToZip(zip, `${file.type}/${file.id}`, buffer);
					}
				}
			}
			res.setHeader("Content-Type", "application/zip");
			res.write(base);
			res.end(await zip.zip());
		}
		else if (req.body.type == "char") {
			const myname = path.join(sFolder, "Comm/char");
			const tXml = fs.readFileSync(path.join(myname, "../", "theme.xml"));
			const zip = nodezip.create();
			fUtil.addToZip(zip, "desc.xml", Buffer.from(tXml));
			fs.readdirSync(myname).forEach(charFolder => {
				fs.readdirSync(path.join(myname, charFolder)).forEach(file => {
					if (file.includes("head")) {
						fs.readdirSync(path.join(myname, `${charFolder}/head`)).forEach(file2 => {
							const buffer = fs.readFileSync(path.join(myname, `${charFolder}/head/${file2}`));
							fUtil.addToZip(zip, `char/${charFolder}/head/${file2}`, buffer);
						})
					} else {
						console.log(`${charFolder}/${file}`);
						const buffer = fs.readFileSync(path.join(myname, `${charFolder}/${file}`));
						fUtil.addToZip(zip, `char/${charFolder}/${file}`, buffer);
					}
				});
			});
			res.setHeader("Content-Type", "application/zip");
			res.end(Buffer.concat([base, await zip.zip()]));
		}
		else {
			const folder = path.join(sFolder, "Comm/effect")
			const tXml = `<theme id="ugc" name="Community Library"><effect id="130628688.swf" name="fx01" type="ANIME" resize="false" move="false" published="1"><tags></tags></effect><effect id="378470.swf" name="tagging" type="ANIME" resize="false" move="false" published="1"><tags></tags></effect><effect id="328993953.swf" name="bubbles" type="ANIME" resize="false" move="false" published="1"><tags>bubbles,nicolas</tags></effect><effect id="378470.swf" name="tagging" type="ANIME" resize="false" move="false" published="1"><tags>happybunny</tags></effect><effect id="378687.swf" name="blur" type="ANIME" resize="false" move="false" published="1"><tags>happybunny</tags></effect><effect id="427112.swf" name="bubbles" type="ANIME" resize="false" move="false" published="1"><tags>bubbles,nicolas</tags></effect><effect id="328995073.swf" name="bubbles" type="ANIME" resize="false" move="false" published="1"><tags>bubbles,nicolas</tags></effect><effect id="275586.swf" name="speed" type="ANIME" resize="false" move="false" published="1"><tags>speed</tags></effect><effect id="267341.swf" name="BOOM2" type="ANIME" resize="false" move="false" published="1"><tags>effect</tags></effect><effect id="823760.swf" name="warpspeed" type="ANIME" resize="false" move="false" published="1"><tags>section31</tags></effect><effect id="267344.swf" name="BOOM3" type="ANIME" resize="false" move="false" published="1"><tags>effect</tags></effect><effect id="469632.swf" name="light by sogeking" type="ANIME" resize="false" move="false" published="1"><tags>effect,light,sogeking</tags></effect><effect id="439039.swf" name="speed" type="ANIME" resize="false" move="false" published="1"><tags>speed</tags></effect><effect id="275699.swf" name="speed" type="ANIME" resize="false" move="false" published="1"><tags>speed</tags></effect><effect id="236080.swf" name="Star" type="ANIME" resize="false" move="false" published="1"><tags>star</tags></effect><effect id="1211151.swf" name="arrowfx" type="ANIME" resize="false" move="false" published="1"><tags>section31</tags></effect><effect id="267339.swf" name="BOOM" type="ANIME" resize="false" move="false" published="1"><tags>effect</tags></effect></theme>`;
			const zip = nodezip.create();
			fUtil.addToZip(zip, "desc.xml", Buffer.from(tXml));
			fs.readdirSync(folder).forEach(file => {
				const buffer = fs.readFileSync(path.join(folder, file));
				fUtil.addToZip(zip, `effect/${file}`, buffer);
			});
			res.setHeader("Content-Type", "application/zip");
			res.end(Buffer.concat([base, await zip.zip()]));
		}
	})
	.route("POST", "/goapi/getUserAssetsXml/", (req, res) => {
		res.assert(req.body.type, 400, { status: "error" });
		res.setHeader("Content-Type", "application/xml");
		const jason = { "type": req.body.type, "count": req.body.count, "page": req.body.page };
		const no = DB.select("assets", req.body.type);
		let tXml = `<theme id="ugc" moreChar="0">`;
		if (!req.body.themeId) {
			if (req.body.type != "char") {
				for (const v of no) {
					if (v.subtype != "video" && v.type == req.body.type && v.subtype != "tts") {
						tXml += Asset.meta2Xml(v);
					}
				}
			}
			else {
				const files = DB.select("assets", { type: "charugc" });
				let xmlMeta = ``;
				for (const v of files) {
					xmlMeta += `<char id="${v.id}" name="${v.title}" published="1" facing="left" thumb="${v.defaultaid}.swf" default="${v.defaultaid}.swf">`;
					for (var b = 0; b < v.idarray.length; b++) {
						xmlMeta += `<action id="${v.idarray[b]}.swf" name="${v.actionnames[b]}"/>`;
					}
					xmlMeta += `</char>`;
				}
				tXml += xmlMeta;
			}
			tXml += `</theme>`;
			res.end(tXml);
		}
		else {
			let themeId;
			switch (req.body.themeId) {
				case "custom":
					themeId = "family"; break;
				case "action":
				case "animal":
				case "botdf":
				case "space":
					themeId = "cc2"; break;
				default: themeId = req.body.themeId;
			}
			const filters = {
				themeId,
				type: "char"
			};
			res.setHeader("Content-Type", "application/xml");
			res.end(listAssets(filters));
		}
	})
	.route("GET", "/api/assets/list", (req, res) => {
		res.json(DB.select("assets"));
	})
	// load
	.route("POST", "/goapi/convertTextToSoundAsset/", async (req, res) => {
		if (req.body.v == "2010") {
			checkcode = 2;
		}
		else {
			checkcode = 1;
		}
		let { voice, text } = req.body;
		let fromttsvoice = info.voices[voice.toLowerCase()];
		res.assert(voice, text, 400, "");
		//Old voices for David and lawrence
		if (req.body.v == "2010") {
			if (voice.toLowerCase() == "david") {
				voice = "david2";
				fromttsvoice = info.voices[voice.toLowerCase()];
			}

			if (voice.toLowerCase() == "lawrence") {
				voice = "lawrence2";
				fromttsvoice = info.voices[voice.toLowerCase()];
			}
		}
		//Do a different function if its a from text to speech voice
		if (fromttsvoice.source != "local" && fromttsvoice.source != "swiftengine" && fromttsvoice.source != "labs" && fromttsvoice.source != "ibox") {
			try {
				const filepath = tempfile(".mp3");
				const writeStream = fs.createWriteStream(filepath);
				let readStream;
				console.log(voice)
				if (req.body.v == "2010") {
					if (voice.toLowerCase() == "paul") {
						voice = "paul2";
					}
				}
				readStream = await processVoice(voice.toLowerCase(), text, first);
				readStream.pipe(writeStream);

				writeStream.on("close", async () => {
					const duration = await rFileUtil.mp3Duration(filepath);
					const meta = {
						duration,
						type: "sound",
						subtype: "tts",
						title: `[${voices[voice.toLowerCase()].desc}] ${text}`
					}
					const id = await Asset.save(filepath, "mp3", meta);
					if (!req.body.v) {
						res.end(`0<response><asset><id>${id}</id><enc_asset_id>${id}</enc_asset_id><type>sound</type><subtype>tts</subtype><title>${meta.title}</title><published>0</published><tags></tags><duration>${meta.duration}</duration><downloadtype>progressive</downloadtype><file>${id}</file></asset></response>`);
					}
					else {
						res.end(`0<asset><tts credit="1"/><id>${id}</id><enc_asset_id>${id}</enc_asset_id><type>sound</type><subtype>tts</subtype><title>${meta.title}</title><published>0</published><tags></tags><duration>${meta.duration}</duration><downloadtype>progressive</downloadtype><file>${id}</file></asset>`);
					}
				});
			} catch (e) {
				console.error("Error generating TTS:", e);
				res.end(`1<error><code>ERR_ASSET_404</code><message>${e}</message><text></text></error>`);
			};
			first = false;
		}
		else {
			console.log("test");
			const buffer = await processVoice(voice.toLowerCase(), text, first);
			const duration = await rFileUtil.mp3Duration(buffer);
			const meta = {
				duration,
				type: "sound",
				subtype: "tts",
				title: `[${voices[voice.toLowerCase()].desc}] ${text}`
			}
			const id = await Asset.save(buffer, "mp3", meta);
			if (!req.body.v) {
				res.end(`0<response><asset><id>${id}</id><enc_asset_id>${id}</enc_asset_id><type>sound</type><subtype>tts</subtype><title>${meta.title}</title><published>0</published><tags></tags><duration>${meta.duration}</duration><downloadtype>progressive</downloadtype><file>${id}</file></asset></response>`);
			}
			else {
				res.end(`0<asset><id>${id}</id><enc_asset_id>${id}</enc_asset_id><type>sound</type><subtype>tts</subtype><title>${meta.title}</title><published>0</published><tags></tags><duration>${meta.duration}</duration><downloadtype>progressive</downloadtype><file>${id}</file></asset>`);
			}
			const { exec } = require('child_process');
			setTimeout(deleteFile, 500);
			//Remove the file after its sent
			function deleteFile() {
				exec('rm file.mp3', (err, stdout, stderr) => {
					if (err) {
						// node couldn't execute the command
						return;
					}

				});
				exec('rm file2.mp3', (err, stdout, stderr) => {
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
			}
		}
	})
	// load
	.route("GET", /\/(assets\/head)\/([\S]+)/, async (req, res) => {
		var sizeOf = require('image-size');
		const sharp = require('sharp');
		let id = req.matches[2];
		const Char = require("../models/char");
		let realid = id.split("/");
		console.log("test", realid);
		//Make a head if it doesnt exist yet
		if (!fs.existsSync(path.join(__dirname, "../../_ASSETS", realid[1].slice(0, -4) + "_head.png"))) {
			sizeOf(path.join(__dirname, "../../_ASSETS", realid[1]), async function (err, dimensions) {
				console.log(err);
				let edith;
				let heig;
				console.log(dimensions.width, dimensions.height);
				for (var v = 0; v < Infinity; v += 0.01) {
					console.log(Math.round(dimensions.width / v));
					if (Math.round(v) == 2) {
						break;
					}
					if (dimensions.width > 70) {
						if (Math.round(dimensions.width / v) == 70) {
							console.log(Math.round(dimensions.width / v));
							edith = Math.round(dimensions.width / v);
							heig = Math.round(dimensions.height / v);
							break;
						}
					}
					else if (dimensions.width < 70) {
						if (Math.round(dimensions.width * v) == 70) {
							console.log(Math.round(dimensions.width * v));
							edith = Math.round(dimensions.width * v);
							heig = Math.round(dimensions.height * v);
							break;
						}
					}
					else {
						console.log("SAME!!!");
						edith = dimensions.width;
						heig = dimensions.height;
						break;
					}
				}
				const buffer = fs.readFileSync(path.join(__dirname, "../../_ASSETS", realid[1]));
				sharp(buffer).resize(edith, heig).toFile(path.join(__dirname, "../../_ASSETS", realid[1].slice(0, -4) + "_head.png"))
					.then(async function () {
						const bruffer = fs.readFileSync(path.join(__dirname, "../../_ASSETS", realid[1].slice(0, -4) + "_head.png"));
						sharp(bruffer).extract({ width: 70, height: 70, left: 0, top: 0 }).toFile(path.join(__dirname, "../../_ASSETS", realid[1].slice(0, -4) + "_head.png"))
							.then(async function () {
								sharp(fs.readFileSync(path.join(__dirname, "../../_ASSETS", realid[1].slice(0, -4) + "_head.png")))
								console.log("Image cropped, resized, and saved");
								res.end(fs.readFileSync(path.join(__dirname, "../../_ASSETS", realid[1].slice(0, -4) + "_head.png")));
							})
					})
				/*.catch(function (err) {
					console.log("An error occured");
					res.statusCode = "500";
					res.json({ "status": "error", "message": err });
				});*/
			});
		}
		else {
			res.end(fs.readFileSync(path.join(__dirname, "../../_ASSETS", realid[1].slice(0, -4) + "_head.png")));
		}
	})

	.route(
		"POST",
		[
			"/goapi/getAsset/",
			"/fbapi/getAsset/",
			"/goapi/getAssetEx/"
		],
		async (req, res) => {
			let id;
			switch (req.method) {
				case "GET":
					id = req.matches[2];
					break;
				case "POST":
					if (!req.body.enc_asset_id) { id = req.body.assetId; } else { id = req.body.enc_asset_id; }
					break;
				default:
					next();
					return;
			}
			if (!id) {
				res.statusCode = 400;
				res.json({ "status": "error" });
			}
			console.log("The id is the: " + id)
			if (req.body.v == "2010" || req.body.v == "2011") {
				try {
					if (!id.includes(".mp3")) {
						let newid;
						if (!id.includes(".")) {
							const files = DB.select("assets", { type: "prop" });
							for (const file of files) {
								console.log(file.subtype);
								if (file.id.includes(id)) {
									newid = file.id;
									console.log("3! 3! 3!");
									break;
								}
							}
							const files2 = DB.select("assets", { type: "charugc" });
							for (const v of files2) {
								if (v.id == id) {
									newid = v.id + ".swf"
								}
							}
						}
						if (newid) res.end(Buffer.concat([base, Asset.load(newid, true)]));
						else res.end(Buffer.concat([base, Asset.load(id, true)]));
					}
					else {
						if (checkcode == 2) {
							console.log("swift");
							res.end(Buffer.concat([base, fs.readFileSync(path.join(dfolder, "swift.swf"))]));
							checkcode = 0;
						}
						else if (checkcode == 0) {
							const file = Asset.load(id, true);
							res.end(file);
						}
						else {
							res.end(Buffer.concat([base, Asset.load(id, true)]));
						}
					}
				} catch (err) {
					if (err.message === "404") {
						res.statusCode = 404;
						res.end("1");
					} else {
						console.log("Error loading asset:", err);
						res.statusCode = 500;
						res.end("1");
					}
				}
			}
			else {
				try {
					const databass = require("../../_SAVED/database");
					//If the id doesnt have the type
					let newid;
					if (!id.includes(".")) {
						const files = DB.select("assets", { type: "prop" });
						for (const file of files) {
							console.log(file.subtype);
							if (file.id.includes(id)) {
								newid = file.id;
								console.log("3! 3! 3!");
								break;
							}
						}
					}
					if (newid) res.end(Asset.load(newid, true));
					else {
						// Return 1 anyway if the asset was deleted and the clipboard "assumes" its there
						if (!id.includes(".mp3")) {
							const files = DB.select("assets", { type: "prop" });
							let there = false;
							for (const file of files) {
								console.log(file.subtype);
								if (file.id.includes(id)) {
									res.end(Asset.load(id, true));
									there = true;
									break;
								}
							}
							if (!there) {
								res.statusCode = 404;
								res.end("1")
							}
						}
						else {
							res.end(Asset.load(id, true));
						}
					}
				} catch (err) {
					if (err.message === "404") {
						res.statusCode = 404;
						res.end("1");
					} else {
						console.log("Error loading asset:", err);
						res.statusCode = 500;
						res.end("1");
					}
				}
			}
		}
	)
	.route("*", [/\/(assets|goapi\/getAsset)\/([\S]+)/, /\/(fbapi\/getAsset)\/([\S]+)/], async (req, res) => {
		let id;
		switch (req.method) {
			case "GET":
				id = req.matches[2];
				break;
			case "POST":
				id = req.body.assetId;
				break;
			default:
				next();
				return;
		}
		if (!id) {
			res.statusCode = 400;
			res.end();
		}
		if (req.body.v == "2010") {
			const zip = await fUtil.zippy(folder, id);
			try {
				res.end(zip);
			} catch (err) {
				if (err.message === "404") {
					res.statusCode = 404;
					res.end("1");
				} else {
					console.log("Error loading asset:", err);
					res.statusCode = 500;
					res.end("1");
				}
			}
		}
		else {
			try {
				res.end(Asset.load(id, true));
			} catch (err) {
				if (err.message === "404") {
					res.statusCode = 404;
					res.end("1");
				} else {
					console.log("Error loading asset:", err);
					res.statusCode = 500;
					res.end("1");
				}
			}
		}
	})
	.route("*", "/static/store//.zip", async (req, res) => {
		try {
			const zip = nodezip.create();
			const file = fs.readFileSync((path.join(sFolder, `theme.xml`)));
			fUtil.addToZip(zip, "theme.xml", file);
			res.setHeader("Content-Type", "application/zip");
			res.end(await zip.zip());
		} catch (e) {
			console.log("Error loading theme:", e);
			res.status(404).end();
		}
	})
	// meta
	//  #get
	.route("POST", "/api_v2/asset/get", (req, res) => {
		const id = req.body?.data.id || req.body?.data.starter_id;
		res.assert(id, 400, { status: "error" });

		try {
			const info = DB.get("assets", id).data;
			console.log(info.isshared);
			type = info.type;
			// add stuff that will never be useful for an offline lvm clone
			info.share = { type: "none" };
			if (info.isshared == true) {
				info.published = "true";
			}
			else {
				info.published = "false";
			}
			res.json({
				status: "ok",
				data: info,
				test: type,
			});
		} catch (e) {
			console.log("Error getting asset info:", e);
			res.statusCode = 404;
			res.json({ status: "error", data: "That doesn't seem to exist." });
		}
	})
	//  #update
	.route("POST", "/api_v2/asset/update/", async (req, res) => {
		const id = req.body.data.id || req.body.data.starter_id;
		res.assert(id, 400, { status: "error" });
		const info = DB.get("assets", req.body.data.assetId).data;
		const template = { "type": info.type, "subtype": info.subtype, "title": req.body.data.title, "ptype": "placeable", "id": req.body.data.assetId, "share": req.body.data.tags };
		const nontemplate = { "type": info.type, "subtype": info.subtype, "title": req.body.data.title, "ptype": "placeable", "id": req.body.data.assetId, "tags": req.body.data.tags, "isshared": false };
		if (req.body.data.published == "1") {
			if (info.type != "char" || info.type != "starter") {
				try {
					if (!info.isshared) {
						nontemplate.isshared = true;
						DB.insert("comm", template);
						DB.update("assets", id, nontemplate);
					}
					else {
						DB.update("assets", id, nontemplate);
						DB.update("comm", req.body.data.id, template);
					}
					res.json({ status: "ok" });
				} catch (e) {
					console.log("Error inserting asset:", e);
					console.log("It's not like anyone will see this anyway...");

					res.statusCode = 405;
					res.json({ status: "unsupported" });
				}
			}
			else {
				res.statusCode = 405;
				res.json({ status: "error", message: "The type: " + req.body.data.type + " can't be added to the community Library" });
			}
		}
		else {
			try {
				if (info.isshared) {
					template.isshared = false;
					DB.delete("comm", id);
				}
				DB.update("assets", id, req.body.data);
				res.json({ status: "ok" });
			} catch (e) {
				console.log("Error updating asset:", e);
				console.log("It's not like anyone will see this anyway...");

				res.statusCode = 404;
				res.json({ status: "error" });
			}
		}
	})
	.route("POST", "/goapi/updateAsset/", (req, res) => {
		const id = req.body.assetId;

		if (req.body.uisa) {
			res.assert(id, 400, { status: "error" });
			const info = DB.get("assets", id);
			type = info.type;
			const data = { "type": type, "subtype": "0", "title": req.body.title, "ptype": "placeable", "id": req.body.assetId, "share": req.body.tag };
			try {
				DB.update("assets", id, data);
				res.json({ status: "ok", test: type });
			} catch (e) {
				console.log("Error updating asset:", e);
				console.log("It's not like anyone will see this anyway...");

				res.statusCode = 404;
				res.json({ status: "error" });
			}
		}
		else {
			res.assert(id, 400, { status: "error" });
			const data = { "type": type, "subtype": "0", "title": req.body.title, "ptype": "placeable", "id": req.body.assetId, "share": req.body.tag };
			try {
				DB.update("assets", id, data);
				res.json({ status: "ok", test: type });
			} catch (e) {
				console.log("Error updating asset:", e);
				console.log("It's not like anyone will see this anyway...");

				res.statusCode = 404;
				res.json({ status: "error" });
			}
		}
	})
	// save
	.route("POST", "/goapi/saveVideo/", async (req, res) => {
		const filepath = req.files.Filedata.filepath;
		console.log(filepath.toString());
		const { ext } = await fromFile(filepath);
		console.log(ext.toString());

		let info = {
			type: "prop",
			subtype: "video",
			title: req.body.title
		}, id = fUtil.generateId() + ".flv";

		res.end(`0<asset><type>prop</type><subtype>video</subtype><title>${info.title}</title><published>0</published><tags></tags><width>0</width><height>0</height><file>${id}</file><id>${id}</id></asset>`);
		const temppath = tempfile(".flv");
		await new Promise((resolve, rej) => {
			// get the height and width
			ffmpeg(filepath).ffprobe((e, data) => {
				if (e) return rej(e);
				info.width = data.streams[0].width || data.streams[1].width;
				info.height = data.streams[0].height || data.streams[1].height;

				// convert the video to an flv
				ffmpeg(filepath)
					.output(temppath)
					.on("end", async () => {
						const readStream = fs.createReadStream(temppath);
						await Asset.save(readStream, id, info);

						// save the first frame
						ffmpeg(filepath)
							.seek("0:00")
							.output(path.join(
								__dirname,
								"../../",
								process.env.ASSET_FOLDER,
								id.slice(0, -3) + "png"
							))
							.outputOptions("-frames", "1")
							.on("end", () => resolve(id))
							.run();
					})
					.on("error", (e) => rej("Error converting video:", e))
					.run();
			});
		});
	})
	.route("POST", "/api/asset/upload", async (req, res) => {
		const file = req.files.import;
		res.assert(
			file,
			req.body.type,
			req.body.subtype,
			400,
			{
				status: "error",
				msg: "Missing one or more fields."
			}
		);

		// get the filename and extension
		const { filepath } = file;
		const origName = file.originalFilename;
		const filename = path.parse(origName).name;
		const { ext } = await fromFile(filepath);

		// validate the file type
		/*if ((fileTypes[req.body.type] || []).indexOf(ext) < 0) {
			res.status(400);
			res.json({
				status: "error",
				msg: "Invalid file type."
			});
			return;
		}*/

		let info = {
			type: req.body.type,
			subtype: req.body.ptype,
			isshared: false,
			title: req.body.name || filename,
		}, stream;

		switch (info.type) {
			case "bg": {
				if (ext == "swf") {
					stream = fs.createReadStream(filepath);
				} else {
					stream = await rFileUtil.resizeImage(filepath, 550, 354);
				}
				stream.pause();

				// save asset
				info.file = await Asset.save(stream, ext, info);
				break;
			}
			case "watermark": {
				stream = fs.createReadStream(filepath);
				stream.pause();

				// save asset
				info.file = await Asset.save(stream, ext, info);
				break;
			}
			case "sound": {
				await new Promise(async (resolve, reject) => {
					if (ext != "mp3") {
						stream = await rFileUtil.convertToMp3(filepath, ext);
					} else {
						stream = fs.createReadStream(filepath);
					}
					const temppath = tempfile(".mp3");
					const writeStream = fs.createWriteStream(temppath);
					stream.pipe(writeStream);
					stream.on("end", async () => {
						info.duration = await rFileUtil.mp3Duration(temppath);
						info.file = await Asset.save(temppath, "mp3", info);
						info.downloadtype = "progressive";
						resolve();
					});
				});
				break;
			}
			case "prop": {
				let { ptype } = req.body;
				// verify the prop type
				switch (ptype) {
					case "placeable":
					case "wearable":
					case "holdable":
						info.ptype = ptype;
					default:
						info.ptype = "placeable";
				}

				if (info.subtype == "video") {
					delete info.ptype;
					const temppath = tempfile(".flv");
					await new Promise((resolve, rej) => {
						// get the height and width
						ffmpeg(filepath).ffprobe((e, data) => {
							if (e) rej(e);
							info.width = data.streams[0].width;
							info.height = data.streams[0].height;

							// convert the video to an flv
							ffmpeg(filepath)
								.output(temppath)
								.on("end", async () => {
									const readStream = fs.createReadStream(temppath);
									info.file = await Asset.save(readStream, "flv", info);

									// save the first frame
									ffmpeg(filepath)
										.seek("0:00")
										.output(path.join(
											__dirname,
											"../../",
											process.env.ASSET_FOLDER,
											info.id.slice(0, -3) + "png"
										))
										.outputOptions("-frames", "1")
										.on("end", () => resolve(info.id))
										.run();
								})
								.on("error", (e) => rej("Error converting video:", e))
								.run();
						});
					});
				} else {
					info.file = await Asset.save(filepath, ext, info);
				}
				break;
			}
			default: {
				res.status(400);
				res.json({
					status: "error",
					msg: "Invalid asset type."
				});
				return;
			}
		}

		// stuff for the lvm
		info.enc_asset_id = info.file;

		res.json({
			status: "ok",
			data: info
		});
	})
	//I have no clue why 
	.route("POST", "/goapi/updateProp/", async (req, res) => {
		console.log(di);
		const pinfo = DB.get("assets", di).data;
		res.assert(req.body.imageData, 400, {
			status: "error",
			msg: "Missing files."
		});

		let info = {
			type: "prop",
			subtype: "0",
			title: pinfo.title,
			ptype: "placeable"
		};
		const buffer = Buffer.from(req.body.imageData, "base64");
		info.file = fs.writeFileSync(path.join(folder, pinfo.id), buffer);
		res.setHeader("Content-Type", "application/xml");
		res.end(`0<prop headable="0" holdable="0" placeable="1" ><id>${di}</id><enc_asset_id>${info.id}</enc_asset_id><type>prop</type><title>${info.title}</title><published>0</published><tags></tags><file>${di}</file></prop>`);
	})
	.route("POST", "/goapi/saveProp/", async (req, res) => {
		const file = req.files.Filedata;
		res.assert(file, req.body.type, req.body.title, 400, {
			status: "error",
			msg: "Missing one or more fields."
		});

		// get the filename and extension
		const { filepath } = file;
		const origName = file.originalFilename;
		const filename = path.parse(origName).name;
		const { ext } = await fromFile(filepath);

		let info = {
			type: "prop",
			subtype: req.body.subtype == "handheld" ? "handheld" : "0",
			title: req.body.title || filename,
			ptype: "placeable"
		};
		info.file = await Asset.save(filepath, ext, info);
		res.setHeader("Content-Type", "application/xml");
		di = info.file;
		console.log(di);
		res.end(`0<prop placeable="1" wearable="0" holdable="0" ><type>${req.body.type}</type><subtype>${req.body.subtype == "handheld" ? "handheld" : "undefined"}</subtype><file>${info.id.slice(0, -4)}</file><id>${info.id.slice(0, -4)}</id><enc_asset_id>${info.id}</enc_asset_id><aid>${info.id.slice(0, -4)}</aid></prop>`);
	})
	.route("POST", "/goapi/saveBackground/", async (req, res) => {
		const file = req.files.Filedata;
		res.assert(file, req.body.title, 400, {
			status: "error",
			msg: "Missing one or more fields."
		});

		// get the filename and extension
		const { filepath } = file;
		const origName = file.originalFilename;
		const filename = path.parse(origName).name;
		const { ext } = await fromFile(filepath);

		let info = {
			type: req.body.type,
			subtype: req.body.subtype,
			isshared: false,
			title: req.body.name || filename,
			ptype: "placeable"
		}, stream;

		info.ptype = "placeable";
		if (ext == "swf") {
			stream = fs.createReadStream(filepath);
		} else {
			stream = await rFileUtil.resizeImage(filepath, 550, 354);
		}
		stream.pause();

		// save asset
		info.file = await Asset.save(stream, ext, info);

		// stuff for the lvm
		info.enc_asset_id = info.file;
		res.setHeader("Content-Type", "application/xml");
		let id = info.file;
		res.end(`0<asset><id>${id}</id><enc_asset_id>${id}</enc_asset_id><type>sound</type><subtype>${info.subtype}</subtype><title>${info.title}</title><published>0</published><tags></tags><duration>${info.duration}</duration><downloadtype>progressive</downloadtype><file>${id}</file></asset>`);
	})
	.route("POST", "/goapi/saveSound/", async (req, res) => {
		checkcode = 1;
		console.log(req.body);
		const isQvmMicRecorder = req.body.v ? true : false;
		isRecord = req.body.bytes ? true : false;

		let filepath, ext, stream;
		if (isRecord) {
			filepath = tempfile(".ogg");
			ext = "ogg";
			const buffer = Buffer.from(req.body.bytes, "base64");
			fs.writeFileSync(filepath, buffer);
		} else {
			// read the file
			filepath = req.files.Filedata.filepath;
			ext = (await fromFile(filepath)).ext;
		}

		let info = {
			type: "sound",
			subtype: req.body.subtype,
			title: req.body.title
		};

		if (ext != "mp3") {
			stream = await rFileUtil.convertToMp3(filepath, ext);
		} else {
			stream = fs.createReadStream(filepath);
		}

		const temppath = tempfile(".mp3");
		const writeStream = fs.createWriteStream(temppath);
		stream.pipe(writeStream);
		stream.on("end", async () => {
			info.duration = await rFileUtil.mp3Duration(temppath);
			const id = await Asset.save(temppath, "mp3", info);
			if (!req.body.v == "2016") res.end(`0<response><asset><id>${id}</id><enc_asset_id>${id}</enc_asset_id><type>sound</type><subtype>${info.subtype}</subtype><title>${info.title}</title><published>0</published><tags></tags><duration>${info.duration}</duration><downloadtype>progressive</downloadtype><file>${id}</file></asset></response>`);
			else if (req.body.v) res.end(`0<asset><id>${id}</id><enc_asset_id>${id}</enc_asset_id><type>sound</type><subtype>${info.subtype}</subtype><title>${info.title}</title><published>0</published><tags></tags><duration>${info.duration}</duration><downloadtype>progressive</downloadtype><file>${id}</file></asset>`);
			else res.end(`0<asset><id>${id.slice(0, -4)}</id><enc_asset_id>${id.slice(0, -4)}</enc_asset_id><type>sound</type><subtype>${info.subtype}</subtype><title>${info.title}</title><published>0</published><tags></tags><duration>${info.duration}</duration><downloadtype>progressive</downloadtype><file>${id.slice(0, -4)}</file></asset>`);
		});
	})
	// thumb
	.route("GET", /\/stock_thumbs\/([\S]+)/, (req, res) => {
		const filepath = path.join(__dirname, "../../", thumbUrl, req.matches[1]);
		if (fs.existsSync(filepath)) {
			fs.createReadStream(filepath).pipe(res);
		} else {
			res.status(404);
			res.end();
		}
	});

module.exports = group;
//Old code that hates me now waaaa
/*.route("POST", "/goapi/getCommunityAssets/", async (req, res) => {
	const handleError = (err) => {
		console.log("Error fetching user info:", err);
		res.statusCode = 500;
		res.end("1");
	};
	const request = https.request({ // gets asset data from GR to work with the community library
		hostname: "goanimate-remastered.joseph-animate.repl.co",
		path: "/ajax/getCommunityAssetData/?type=prop",
		method: "POST",
		headers: {
			"User-Agent": req.headers['user-agent']
		}
	}, (res2) => {
		let buffers = [];
		res2.on("data", (c) => buffers.push(c)).on("end", async () => {
			const meta = JSON.parse(Buffer.concat(buffers));
			var tXml = `<theme id="ugc" name="Community Library">`
			for (const v of meta) tXml += Asset.meta2StoreXml(v);
			const zip = nodezip.create();
			fUtil.addToZip(zip, "desc.xml", tXml + "</theme>");
			for (const file of meta) {
				const buffer = await get(`http://localhost:4343/assets/${file.id}`);
				fUtil.addToZip(zip, `${file.type}/${file.id}`, buffer);
			}
			res.setHeader("Content-Type", "application/zip");
			res.end(Buffer.concat([base, await zip.zip()]));
		}).on("error", handleError);
	}).on("error", handleError);
	request.end();
})
.route("POST", "/goapi/getCommunityAssets/", async (req, res) => {
	const handleError = (err) => {
		console.log("Error fetching asset info:", err);
		res.statusCode = 500;
		res.end("1");
	};
	https.request({ // gets asset data from GR to work with the community library
		hostname: "goanimate-remastered.joseph-animate.repl.co",
		path: `/ajax/getCommunityAssetData/?type=${req.body.type}`,
		method: "POST",
		headers: {
			"User-Agent": req.headers['user-agent']
		}
	}, (res2) => {
		let buffers = [];
		res2.on("data", (c) => buffers.push(c)).on("end", async () => {
			const meta = JSON.parse(Buffer.concat(buffers));
			var tXml = `<theme id="ugc" name="Community Library">`
			for (const v of meta) tXml += Asset.meta2StoreXml(v);
			const zip = nodezip.create();
			fUtil.addToZip(zip, "desc.xml", tXml + "</theme>");
			for (const file of meta) {
				var buffer;
				if (file.mode != "char") buffer = await get(`http://localhost:4343/assets/${file.mId}`);
				else buffer = await get(`http://localhost:4343/characters/${file.id}`);
				fUtil.addToZip(zip, `${file.mode}/${file.id}`, buffer);
			}
			res.setHeader("Content-Type", "application/zip");
			res.end(Buffer.concat([base, await zip.zip()]));
		}).on("error", handleError);
	}).on("error", handleError).end();
})*/