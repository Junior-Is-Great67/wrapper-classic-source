/**
 * character routes
 */
// modules
const fs = require("fs");
const httpz = require("@octanuary/httpz");
const path = require("path");
const fold = path.join(__dirname, "../../", "_ASSETS");
const database = require("../../data/database"), DB = new database();
const nodezip = require("node-zip");
let isAction = false;
let charpart;
let whatCCTheme;
// vars
const base = Buffer.alloc(1, "0");
const defaultTypes = {
	family: "adam",
	anime: "guy",
	cctoonadventure: "default"
};
// stuff
const Char = require("../models/char");
const { exists } = require("../models/asset");
const folder = path.join(__dirname, "../../server", "/static/store/cc_store");
const sfolder = path.join(__dirname, "../../server", "/static/store/cc_store");
// create the group
const group = new httpz.Group();
const fUtil = require("../../utils/fileUtil");
let trim;
let trim2;
let isCC = false;
let is2010 = false;
let whereWeAt = -1;
function makeACCCharComponentsGoInAnArrayThatIsFormattedLikeThe2010LVMSupports(component) {
	console.log(component);
	let arrary = [];
	for (let i = 0; i < component.length; i++) {
		arrary.push(`${component[i]._attributes.theme_id}.${component[i]._attributes.type}.${component[i]._attributes.component_id}.swf`);
	}
	return arrary;
}
function meta2libraryXml(w) {
	let xml;
	xml = `<library type="${w._attributes.type}" file="${w._attributes.component_id}" path="${w._attributes.component_id}" component_id="${w._attributes.component_id}" theme_id="${w._attributes.theme_id}"/>`
	return xml;
}
function meta2componentXml(v) {
	let xml;
	let ty = v._attributes.type;

	if (ty == "eye" || ty == "eyebrow" || ty == "mouth") {
		let animetype = v._attributes.theme_id == "anime" ? "side_" + trim2[ty] : v._attributes.theme_id == "business" || v._attributes.theme_id == "infographics" ? "front_" + trim2[ty] : trim2[ty];
		xml = `<component type="${v._attributes.type}" ${isAction ? `component_id="${v._attributes.component_id}"` : ``} theme_id="${v._attributes.theme_id}" file="${animetype}.swf" path="${v._attributes.component_id}" x="${v._attributes.x}" y="${v._attributes.y}" xscale="${v._attributes.xscale}" yscale="${v._attributes.yscale}" offset="${v._attributes.offset}" rotation="${v._attributes.rotation}" ${v._attributes.split ? `split="N"` : ``}/>`;
	}
	else {
		if (v._attributes.id) xml = `<component id="${v._attributes.id}" ${isAction ? `file="default.swf"` : ``} type="${v._attributes.type}" theme_id="${v._attributes.theme_id}" ${isAction ? `component_id="${v._attributes.component_id}"` : ``} path="${v._attributes.component_id}" x="${v._attributes.x}" y="${v._attributes.y}" xscale="${v._attributes.xscale}" yscale="${v._attributes.yscale}" offset="${v._attributes.offset}" rotation="${v._attributes.rotation}" />`;
		else if (v._attributes.type != "skeleton" && v._attributes.type != "bodyshape" && v._attributes.type != "freeaction") xml = `<component type="${v._attributes.type}" theme_id="${v._attributes.theme_id}" ${isCC || isAction && v._attributes.theme_id != "business" || v._attributes.theme_id == "infographics" ? `file="default.swf"` : v._attributes.theme_id == "business" || v._attributes.theme_id == "infographics" ? `file="front_default.swf"` : ``} ${isAction ? `component_id="${v._attributes.component_id}"` : ``} path="${v._attributes.component_id}" x="${v._attributes.x}" y="${v._attributes.y}" xscale="${v._attributes.xscale}" yscale="${v._attributes.yscale}" offset="${v._attributes.offset}" rotation="${v._attributes.rotation}" />`;
		else xml = `<component type="${v._attributes.type}" theme_id="${v._attributes.theme_id}" ${v._attributes.type == "skeleton" ? `file="stand.swf"` : v._attributes.type == "freeaction" && v._attributes.theme_id == "cc2" ? `file="stand.swf"` : v._attributes.type == "freeaction" && (v._attributes.theme_id == "business" || v._attributes.theme_id == "infographics") ? `file="stand01.swf"` : `file="thumbnail.swf"`} path="${v._attributes.component_id}" ${isAction ? `component_id="${v._attributes.component_id}"` : ``} x="${v._attributes.x}" y="${v._attributes.y}" xscale="${v._attributes.xscale}" yscale="${v._attributes.yscale}" offset="${v._attributes.offset}" rotation="${v._attributes.rotation}" />`;
	}
	return xml;
}

group
	// load
	.route("POST", "/goapi/getCcCharCompositionXml/", (req, res) => {
		const id = req.body.assetId;
		res.assert(id, 400, "Missing one or more fields.");

		console.log(`Loading character #${id}...`);
			const buf = Char.load(id);
			if (buf != "1")
			{
			res.setHeader("Content-Type", "application/xml");
			res.end(Buffer.concat([base, buf]));
			}
	})
	// premade
	.route("POST", "/ajax/getCCPreMadeCharacters", (req, res) => {
		if (req.body.cat == "*" || req.body.cat == "ugc") {
			let themeId = req.body.theme_code;
			let response = [];
			const filters = {
				themeId,
				type: "char"
			};
			let files = DB.select("assets", filters);
			// Reconstruct the cc list
			for (const v of files) {
				response.push({ "id": v.id, "tid": v.id, "tags": "ugc", "url": `assets/${v.id}.png`, "money": "0", "sharing": "0" });
			}
			res.json(response);
		}
		else {
			res.json({ error: "No stock chars exist yet" });
		}
	})
	.route("POST", "/goapi/getCCPreMadeCharacters", async (req, res) => {
		let chars;
		let themeId = req.body.themeId;
		if (themeId == "family")
		{
		chars += `<?xml version="1.0" encoding="utf-8"?>`
		const database = require("../../data/database"), DB = new database();
		const filters = {
			themeId,
			type: "char"
		};
		let files = DB.select("assets", filters);
		let rype = [
			"professions",
			"celebrities"
		]
		let num = 0;
		const xml = fs.readFileSync(path.join(__dirname, "../../wrapper/data", "family_stock.xml"), 'utf-8');
		var convert = require('xml-js');
		const buf = xml;
		let result = convert.xml2json(buf.toString(), { compact: true, spaces: 4 });
		const realresult = JSON.parse(result);
		for (const meta of realresult.chars.char)
		{
		const char = await Char.load(meta._attributes.id)
		console.log(char.toString());
		chars += `<cc_char aid="${meta._attributes.id}" tags="family,_category_${meta.tags._text.includes("Specialties") ? "professions" : "celebrities"}"id="${meta._attributes.id}" name="${meta._attributes.name}" ${char.toString().substring(8)}`;		
		}
		res.setHeader("Content-Type", "application/xml");
		res.end(chars.substring(9));
		// chars.substring(9)
		}
		else
		{
		res.end();
		}
	})
	// redirect
	.route("GET", /\/go\/character_creator\/(\w+)(\/\w+)?(\/.+)?$/, (req, res) => {
		let [, theme, mode, id] = req.matches;

		let redirect;
		switch (mode) {
			case "/copy": {
				redirect = `/cc?themeId=${theme}&original_asset_id=${id.substring(1)}`;
				break;
			} default: {
				const type = req.query.type || defaultTypes[theme] || "";
				redirect = `/cc?themeId=${theme}&bs=${type}`;
				break;
			}
		}

		res.redirect(redirect);
	})
	.route("GET", "/go/character_creator", (req, res) => {
		//2010???
		let redirect = `/cc?themeId=family&v=2010`;

		res.redirect(redirect);
	})
	.route("GET", /^\/static\/store\/custom\/char\/(\d+)\/(\w+\.xml)$/, async (req, res) => {
		var convert = require('xml-js');
		const charId = req.matches[1];
		isAction = true;
					const buf = await Char.load(charId);
					let result = convert.xml2json(buf.toString(), { compact: true, spaces: 4 });
					const data = JSON.parse(result);
					const themeid = data.cc_char.component[0]._attributes.theme_id;
					const libArray = data.cc_char.library;
					let mappedLibrary;
					if (themeid == "cc2" || themeid == "business") {
						mappedLibrary = libArray.map(meta2libraryXml).join("");
					}
					trim = fs.readFileSync(path.join(folder, themeid, "emotions", "head_neutral.json"));
					trim2 = JSON.parse(trim);
					const colorArray = data.cc_char.color;
					let mappedColors;
					mappedColors = colorArray.map(Char.meta2colourXml).join("");
					const componentArray = data.cc_char.component;
					let mappedComponent;
					mappedComponent = componentArray.map(meta2componentXml).join("");
					res.setHeader("Content-type", "application/xml");
					res.end(`<cc_char ${data.cc_char._attributes ? `xscale='${data.cc_char._attributes.xscale}' yscale='${data.cc_char._attributes.yscale}' hxscale='${data.cc_char._attributes.hxscale}' hyscale='${data.cc_char._attributes.hyscale}' headdx='${data.cc_char._attributes.headdx}' headdy='${data.cc_char._attributes.headdy}'` : ``}>
			${mappedColors}
			${mappedComponent}${themeid == "cc2" || themeid == "business" ? mappedLibrary : ``}</cc_char>`);
		
	})
	// save
	//  #all
	.route("POST", "/goapi/saveoldCCCharacter/", (req, res) => {
		res.assert(
			req.body.body,
			400, "Missing one or more fields."
		);
		const body = req.body.body;
		let thumb;
		if (req.body.imagedata)
		{
		thumb = Buffer.from(req.body.imagedata, "base64");
		}

		const meta = {
			type: "char",
			subtype: 0,
			title: req.body.title,
			themeId: req.body.themeId ? req.body.themeId : "family"
		};
		const id = Char.save(body, meta);
		if (req.body.imagedata)
		{
		Char.saveThumb(id, thumb);
		}
		res.end("0" + id);
	})
	.route("POST", "/ajax/saveCCCharacterTemplate", (req, res) => {
		const id = req.body.assetId;
		res.assert(id, 400, "Missing one or more fields.");
		console.log(`Loading character #${id}...`);
		try {
			res.setHeader("Content-Type", "text/xml");
			res.end(`0<asset><type>char</type><file>${id.slice(0, -4)}</file><id>${id.slice(0, -4)}</id><asset_id>${id.slice(0, -4)}</asset_id></asset>`);
		} catch (e) {
			console.log("But nobody came.");
			res.status(404);
			res.end("1");
		}
	})
	.route("POST", "/goapi/saveCCCharacter/", (req, res) => {
		res.assert(
			req.body.body,
			req.body.thumbdata,
			req.body.themeId,
			400, "Missing one or more fields."
		);
		const body = Buffer.from(req.body.body);
		const thumb = Buffer.from(req.body.thumbdata, "base64");
		const head = Buffer.from(req.body.imagedata, "base64");

		const meta = {
			type: "char",
			subtype: 0,
			title: "Untitled",
			themeId: req.body.themeId
		};
		const id = Char.save(body, meta);
		Char.saveThumb(id, thumb, head);
		res.end("0" + id);
	})
	//  #thumbs
	.route("POST", "/goapi/saveCCThumbs/", (req, res) => {
		const id = req.body.assetId;
		res.assert(
			req.body.thumbdata,
			id,
			400, "Missing one or more fields."
		);
		const thumb = Buffer.from(req.body.thumbdata, "base64");

		if (exists(`${id}.xml`)) {
			Char.saveThumb(id, thumb);
			res.end("0" + id);
		} else {
			res.end("1");
		}
	})
	.route("POST", "/goapi/saveCCThumbs/", (req, res) => {
		const id = req.body.assetId;
		res.assert(
			req.body.thumbdata,
			id,
			400, "Missing one or more fields."
		);
		const thumb = Buffer.from(req.body.thumbdata, "base64");

		if (exists(`${id}.xml`)) {
			Char.saveThumb(id, thumb);
			res.end("0" + id);
		} else {
			res.end("1");
		}
	})
	.route("POST", "/goapi/getCharacter/", async (req, res) => {
		//Check first to see if its a cc theme
		let isCcThemeChar = false;
		let isCustomChar = false;
		console.log(whatCCTheme);
		const filters = {
			themeId: whatCCTheme,
			type: "char"
		};
		const files = DB.select("assets", filters);
		for (const file in files) {
			if (files[file].id == req.body.assetId) {
				isCcThemeChar = true;
				break;
			}
		}
		const filters2 = {
			type: "charugc"
		};
		const files2 = DB.select("assets", filters2);
		for (const file2 in files2) {
			if (files2[file2].id == req.body.assetId) {
				isCustomChar = true;
				break;
			}
		}
		//This code is so hard for people so hear are commentz
		if (!isCcThemeChar) {
			var convert = require('xml-js');
			const zip = nodezip.create();
			let num;
			let xnl;
			if (!isCustomChar) xnl= fs.readFileSync(path.join(__dirname, "../../server", "/static/store/Comm", "theme.xml")).toString();
			else xnl = Char.createCharMeta(req.body.assetId);
			let result = convert.xml2json(xnl, { compact: true, spaces: 4 });
			console.log(result);
			const data = JSON.parse(result);
			let hasmatch = false;
			if (isCustomChar) fUtil.addToZip(zip,`desc.xml`,Buffer.from(xnl));
			if (data.theme.char[0] !== undefined)
			{
			for (let i = 0; i < data.theme.char.length; i++) {
				num = i;
				if (data.theme.char[i]._attributes.id == req.body.assetId) {
					// Was used for logging

					console.log("We've found a match here..");
					//console.log("Heres the json metainfo:", data.theme.char[i]._attributes);
					//console.log("And the actions:", data.theme.char[num].action);
					//Handler for one action chars
					if (data.theme.char[num].action[0] === undefined) {
						if (fs.existsSync(path.join(__dirname, "../../server", "/static/store/Comm/char", req.body.assetId, data.theme.char[num].action._attributes.id))) fUtil.addToZip(zip, `char/${req.body.assetId}/${data.theme.char[num].action._attributes.id}`, fs.readFileSync(path.join(__dirname, "../../server", "/static/store/Comm/char", req.body.assetId, data.theme.char[num].action._attributes.id)));
						else fUtil.addToZip(zip, `char/${req.body.assetId}/${data.theme.char[num].action._attributes.id}`, fs.readFileSync(path.join(__dirname, "../../_ASSETS", data.theme.char[num].action._attributes.id)));
					}
					else {
						for (let b = 0; b < data.theme.char[num].action.length; b++) {
							// Check if the action exists before going rogue to add them
							if (fs.existsSync(path.join(__dirname, "../../server", "/static/store/Comm/char", req.body.assetId, data.theme.char[num].action[b]._attributes.id))) {
								fUtil.addToZip(zip, `char/${req.body.assetId}/${data.theme.char[num].action[b]._attributes.id}`, fs.readFileSync(path.join(__dirname, "../../server", "/static/store/Comm/char", req.body.assetId, data.theme.char[num].action[b]._attributes.id)));
							}
							else if (fs.existsSync(path.join(__dirname, "../../_ASSETS", data.theme.char[num].action[b]._attributes.id)))
							{
								fUtil.addToZip(zip, `char/${req.body.assetId}/${data.theme.char[num].action._attributes.id}`, fs.readFileSync(path.join(__dirname, "../../_ASSETS", data.theme.char[num].action._attributes.id)));							
							}
						}
					}
					hasmatch = true;
				}
			}
			}
			else
			{
				if (data.theme.char._attributes.id == req.body.assetId) {
					// Was used for logging

					console.log("We've found a match here..");
					//console.log("Heres the json metainfo:", data.theme.char[i]._attributes);
					//console.log("And the actions:", data.theme.char[num].action);
					//Handler for one action chars
					if (data.theme.char.action[0] === undefined) {
						if (fs.existsSync(path.join(__dirname, "../../server", "/static/store/Comm/char", req.body.assetId, data.theme.char.action._attributes.id))) fUtil.addToZip(zip, `char/${req.body.assetId}/${data.theme.char.action._attributes.id}`, fs.readFileSync(path.join(__dirname, "../../server", "/static/store/Comm/char", req.body.assetId, data.theme.char.action._attributes.id)));
						else fUtil.addToZip(zip, `char/${req.body.assetId}/${data.theme.char.action._attributes.id}`, fs.readFileSync(path.join(__dirname, "../../_ASSETS", data.theme.char.action._attributes.id)));
					}
					else {
						for (let b = 0; b < data.theme.char.action.length; b++) {
							// Check if the action exists before going rogue to add them
							if (fs.existsSync(path.join(__dirname, "../../server", "/static/store/Comm/char", req.body.assetId, data.theme.char.action[b]._attributes.id))) {
								fUtil.addToZip(zip, `char/${req.body.assetId}/${data.theme.char.action[b]._attributes.id}`, fs.readFileSync(path.join(__dirname, "../../server", "/static/store/Comm/char", req.body.assetId, data.theme.char.action[b]._attributes.id)));
							}
							else if (fs.existsSync(path.join(__dirname, "../../_ASSETS", data.theme.char.action[b]._attributes.id)))
							{
								fUtil.addToZip(zip, `char/${req.body.assetId}/${data.theme.char.action[b]._attributes.id}`, fs.readFileSync(path.join(__dirname, "../../_ASSETS", data.theme.char.action[b]._attributes.id)));							
							}
						}
					}
					hasmatch = true;
				}			
			}
			if (hasmatch) {

				res.end(await zip.zip());
			}
			else {
				res.statusCode = "500";
				res.json({ "status": "error", "massage": "Character not found, listed wrong" });
			}
		}
		else {
			var convert = require('xml-js');
			const zip = nodezip.create();
			const buf = await Char.load(req.body.assetId);
			const filters = {
				themeId: whatCCTheme,
				type: "char"
			};
			const files = DB.select("assets", filters);
			for (const file in files) {
				if (files[file].id == req.body.assetId) {
					whereWeAt = file;
					console.log("WE FOUD IT!")
					break;
				}
			}
			console.log(buf);
			let result = convert.xml2json(buf.toString(), { compact: true, spaces: 4 });
			const data = JSON.parse(result);
			const themeid = data.cc_char.component[0]._attributes.theme_id;
			const libArray = data.cc_char.library;
			let mappedLibrary;
			if (themeid == "cc2" || themeid == "business") {
				mappedLibrary = libArray.map(meta2libraryXml).join("");
			}
			trim = fs.readFileSync(path.join(folder, themeid, "emotions", "head_neutral.json"));
			trim2 = JSON.parse(trim);
			const colorArray = data.cc_char.color;
			let mappedColors;
			isAction = true;
			mappedColors = colorArray.map(Char.meta2colourXml).join("");
			const componentArray = data.cc_char.component;
			let mappedComponent;
			mappedComponent = componentArray.map(meta2componentXml).join("");
			res.setHeader("Content-type", "application/zip");
			let actions = ["stand", "walk", "excited","xarms","xarmseve"];
			let expressionproperties = ["head_neutral", "head_neutral", "head_happy","head_neutral","head_neutral"];
			for (var num = 0; num < actions.length; num++) {
				console.warn("Loading action #",actions[num]);
				const actionzip = nodezip.create();
				let json = fs.readFileSync(path.join(folder, themeid, "emotions", `${expressionproperties[num]}.json`));
				let json2 = JSON.parse(json);
				let json3 = fs.readFileSync(path.join(folder, 'family', "emotions", `${actions[num]}.json`));
				let json4 = JSON.parse(json3);
				fUtil.addToZip(actionzip, `desc.xml`, Buffer.from(`<cc_char ${data.cc_char._attributes ? `xscale='${data.cc_char._attributes.xscale}' yscale='${data.cc_char._attributes.yscale}' hxscale='${data.cc_char._attributes.hxscale}' hyscale='${data.cc_char._attributes.hyscale}' headdx='${data.cc_char._attributes.headdx}' headdy='${data.cc_char._attributes.headdy}'` : ``}>${mappedColors}${mappedComponent}${themeid == "cc2" || themeid == "business" ? mappedLibrary : ``}</cc_char>`));
				for (let i = 0; i < charpart[whereWeAt].length; i++) {
					let pieces = charpart[whereWeAt][i].split(".");
					fUtil.addToZip(actionzip, charpart[whereWeAt][i], fs.readFileSync(path.join(__dirname, `../../server`, `/static/store/cc_store/${pieces[0]}/${pieces[1]}/${pieces[2]}/${pieces[1] == "skeleton" ? json4.skeleton : pieces[1] == "bodyshape" ? `thumbnail` : pieces[1] == "eye" ? json2.eye : pieces[1] == "eyebrow" ? json2.eyebrow : pieces[1] == "mouth" ? json2.mouth : pieces[1] == "lower_body" ? json4.lower_body : pieces[1] == "upper_body" ? json4.upper_body : `default`}.swf`,)));
				}
				fUtil.addToZip(zip, `char/${req.body.assetId}/${actions[num]}.xml`, Buffer.from(await actionzip.zip()));
			}


			if (themeid == "family")
			{
			let testfacials = ["neutral","shocked","angry","sad","talk_a","evilsmile","reallyangry"];
			for (a = 0; a < testfacials.length; a++)
			{
			isAction = false;
			const facialzip = nodezip.create();
			let json = fs.readFileSync(path.join(folder, themeid, "emotions", `head_${testfacials[a]}.json`),'utf-8');
			let json2 = JSON.parse(json);
			fUtil.addToZip(facialzip, `desc.xml`, Buffer.from(`<cc_char ${data.cc_char._attributes ? `xscale='${data.cc_char._attributes.xscale}' yscale='${data.cc_char._attributes.yscale}' hxscale='${data.cc_char._attributes.hxscale}' hyscale='${data.cc_char._attributes.hyscale}' headdx='${data.cc_char._attributes.headdx}' headdy='${data.cc_char._attributes.headdy}'` : ``}>${mappedColors}${mappedComponent}${themeid == "cc2" || themeid == "business" ? mappedLibrary : ``}</cc_char>`));
			for (let i = 0; i < charpart[whereWeAt].length; i++) {
				let pieces = charpart[whereWeAt][i].split(".");
				if (pieces[1] != "lower_body"|| pieces[1] != "upper_body"|| pieces[1] != "skeleton") fUtil.addToZip(facialzip, charpart[whereWeAt][i], fs.readFileSync(path.join(__dirname, `../../server`, `/static/store/cc_store/${pieces[0]}/${pieces[1]}/${pieces[2]}/${pieces[1] == "skeleton" ? `stand` : pieces[1] == "bodyshape" ? `thumbnail` : pieces[1] == "mouth" ? json2.mouth : pieces[1] == "eyebrow" ? json2.eyebrow : pieces[1] == "eye" ? json2.eye : pieces[1] != "lower_body" && pieces[1] != "upper_body" ? `default` : `default`}.swf`,)));
			}
			fUtil.addToZip(zip, `char/${req.body.assetId}/head/head_${testfacials[a]}.xml`, Buffer.from(await facialzip.zip()));
			}
			}
			res.end(await zip.zip());
		}
	})
	//oh my god this will be useful for getCharacterAction
	.route("POST", "/getCharSwfPartsForThe2010LvmRightFreakingNow", async (req, res) => {
		charpart = req.body.array;
		whatCCTheme = req.body.themeid;
		console.log(req.body.themeid);
		is2010 = true;
		whereWeAt = -1;
		res.end();
	})
	.route("POST", "/goapi/getUserAssets", async (req, res) => {
		console.log("call")
		is2010 = false;
		whereWeAt = -1;
	})
	.route("POST", "/goapi/getCharacterAction/", async (req, res) => {
		var convert = require('xml-js');
		if (req.body.actionId.includes(".zip")) {
			isAction = true;
			whereWeAt++;
			const zip = nodezip.create();
			const filters = {
				themeId: "family",
				type: "char"
			};
			const buf = await Char.load(req.body.charId);
			let result = convert.xml2json(buf.toString(), { compact: true, spaces: 4 });
			const realresult = JSON.parse(result);
			let charpart = [];
			charpart.push(makeACCCharComponentsGoInAnArrayThatIsFormattedLikeThe2010LVMSupports(realresult.cc_char.component));
			whereWeAt = charpart.length - 1;
			let cid;
			cid = req.body.charId;
			const desc = Char.load(cid);
			let json;
			if (req.body.facialId != "") json = fs.readFileSync(path.join(folder, 'family', "emotions", `${req.body.facialId.slice(0, -4)}.json`));
			else json = fs.readFileSync(path.join(folder, 'family', "emotions", `head_neutral.json`));
			let json2 = JSON.parse(json);
			let json3 = fs.readFileSync(path.join(folder, 'family', "emotions", `${req.body.actionId.slice(0, -4)}.json`));
			let json4 = JSON.parse(json3);
			fUtil.addToZip(zip, "desc.xml", Buffer.from(desc));
			for (let i = 0; i < charpart[whereWeAt].length; i++) {
				let pieces = charpart[whereWeAt][i].split(".");
				fUtil.addToZip(zip, charpart[whereWeAt][i], fs.readFileSync(path.join(__dirname, `../../server`, `/static/store/cc_store/${pieces[0]}/${pieces[1]}/${pieces[2]}/${pieces[1] == "skeleton" || pieces[1] == "freeaction" ? json4.skeleton : pieces[1] == "bodyshape" ? `thumbnail` : pieces[1] == "eye" ? json2.eye : pieces[1] == "eyebrow" ? json2.eyebrow : pieces[1] == "mouth" ? json2.mouth : pieces[1] == "upper_body" ? json4.upper_body : pieces[1] == "lower_body" ? json4.lower_body : `default`}.swf`,)));
			}
			res.end(await zip.zip());
		}
		else {
			if (req.body.facialId.includes(".xml")) {
				res.assert(
					req.body.charId,
					req.body.facialId,
					400, "Missing one or more fields."
				);
				isAction = false;
				const buf = await Char.load(req.body.charId.slice(0, -5));
				let result = convert.xml2json(buf.toString(), { compact: true, spaces: 4 });
				const data = JSON.parse(result);
				const themeid = data.cc_char.component[0]._attributes.theme_id;
				trim = fs.readFileSync(path.join(folder, themeid, "emotions", req.body.facialId.slice(0, -4) + ".json"));
				trim2 = JSON.parse(trim);
				const colorArray = data.cc_char.color;
				let mappedColors;
				mappedColors = colorArray.map(Char.meta2colourXml).join("");

				const componentArray = data.cc_char.component;
				let mappedComponent;
				mappedComponent = componentArray.map(meta2componentXml).join("");

				res.setHeader("Content-Type", "application/xml");
				res.end(`<facial>
			${mappedColors}
			${mappedComponent}</facial>`);
			}
			else if (req.body.actionId.includes(".xml")) {
				if (req.body.default != undefined) {
					isAction = true;
					const buf = await Char.load(req.body.charId);
					let result = convert.xml2json(buf.toString(), { compact: true, spaces: 4 });
					const data = JSON.parse(result);
					const themeid = data.cc_char.component[0]._attributes.theme_id;
					const libArray = data.cc_char.library;
					let mappedLibrary;
					if (themeid == "cc2" || themeid == "business" || themeid == "infographics") {
						mappedLibrary = libArray.map(meta2libraryXml).join("");
					}
					trim = fs.readFileSync(path.join(folder, themeid, "emotions", "head_neutral.json"));
					trim2 = JSON.parse(trim);
					const colorArray = data.cc_char.color;
					let mappedColors;
					mappedColors = colorArray.map(Char.meta2colourXml).join("");
					const componentArray = data.cc_char.component;
					let mappedComponent;
					mappedComponent = componentArray.map(meta2componentXml).join("");
					res.setHeader("Content-type", "application/xml");
					res.end(`<cc_char ${data.cc_char._attributes ? `xscale='${data.cc_char._attributes.xscale}' yscale='${data.cc_char._attributes.yscale}' hxscale='${data.cc_char._attributes.hxscale}' hyscale='${data.cc_char._attributes.hyscale}' headdx='${data.cc_char._attributes.headdx}' headdy='${data.cc_char._attributes.headdy}'` : ``}>
			${mappedColors}
			${mappedComponent}${themeid == "cc2" || themeid == "infographics" || themeid == "business" ? mappedLibrary : ``}</cc_char>`);
				}
				else if (!req.body.facialId.includes(".zip")) {
					console.log("SEE ME!")
					isAction = true;
					whereWeAt++;
					const zip = nodezip.create();
					const filters = {
						themeId: whatCCTheme,
						type: "char"
					};
					const files = DB.select("assets", filters);
					let hasFoundItYet = false;
					//Filter by POS
					for (const file in files) {
						if (files[file].id == req.body.charId) {
							whereWeAt = file;
							hasFoundItYet = true;
							break;
						}
					}
					if (!hasFoundItYet) {
						const buf = await Char.load(req.body.charId);
						let result = convert.xml2json(buf.toString(), { compact: true, spaces: 4 });
						const realresult = JSON.parse(result);
						charpart.push(makeACCCharComponentsGoInAnArrayThatIsFormattedLikeThe2010LVMSupports(realresult.cc_char.component));
						whereWeAt = charpart.length - 1;
					}
					let cid;
					if (hasFoundItYet) {
						cid = files[whereWeAt].id;
					}
					else {
						cid = req.body.charId;
					}
					const desc = Char.load(cid);
					fUtil.addToZip(zip, "desc.xml", Buffer.from(desc),);
					for (let i = 0; i < charpart[whereWeAt].length; i++) {
						let pieces = charpart[whereWeAt][i].split(".");
						fUtil.addToZip(zip, charpart[whereWeAt][i], fs.readFileSync(path.join(__dirname, `../../server`, `/static/store/cc_store/${pieces[0]}/${pieces[1]}/${pieces[2]}/${pieces[1] == "skeleton" || pieces[1] == "freeaction" ? `stand` : pieces[1] == "bodyshape" ? `thumbnail` : `default`}.swf`,)));
					}
					res.end(await zip.zip());
				}
				else
				{
					isAction = true;
					whereWeAt++;
					const zip = nodezip.create();
					const filters = {
						themeId: whatCCTheme,
						type: "char"
					};
					const files = DB.select("assets", filters);
					let hasFoundItYet = false;
					//Filter by POS
					for (const file in files) {
						if (files[file].id == req.body.charId) {
							whereWeAt = file;
							hasFoundItYet = true;
							console.log("WE FOUD IT!");
							break;
						}
					}
					if (!hasFoundItYet) {
						const buf = await Char.load(req.body.charId);
						let result = convert.xml2json(buf.toString(), { compact: true, spaces: 4 });
						const realresult = JSON.parse(result);
						charpart.push(makeACCCharComponentsGoInAnArrayThatIsFormattedLikeThe2010LVMSupports(realresult.cc_char.component));
						whereWeAt = charpart.length - 1;
					}
					let cid;
					if (hasFoundItYet) {
						cid = files[whereWeAt].id;
					}
					else {
						cid = req.body.charId;
					}
					const desc = Char.load(cid);
					let json = fs.readFileSync(path.join(folder, themeid, "emotions", `${req.body.facialId.slice(0,-4)}.json`));
					let json2 = JSON.parse(json);
					let json3 = fs.readFileSync(path.join(folder, themeid, "emotions", `${req.body.actionId.slice(0,-4)}.json`));
					let json4 = JSON.parse(json3);
					fUtil.addToZip(zip, "desc.xml", Buffer.from(desc),);
					for (let i = 0; i < charpart[whereWeAt].length; i++) {
						let pieces = charpart[whereWeAt][i].split(".");
						fUtil.addToZip(zip, charpart[whereWeAt][i], fs.readFileSync(path.join(__dirname, `../../server`, `/static/store/cc_store/${pieces[0]}/${pieces[1]}/${pieces[2]}/${pieces[1] == "skeleton" || pieces[1] == "freeaction" ? json4.skeleton : pieces[1] == "bodyshape" ? `thumbnail` : pieces[1] == "eye" ? json2.eye :pieces[1] == "eyebrow" ? json2.eyebrow : pieces[1] == "mouth" ? json2.mouth : pieces[1] == "upper_body" ? json4.upper_body : pieces[1] == "lower_body" ? json4.lower_body : `default`}.swf`,)));
					}
					res.end(await zip.zip());				
				}
			}
			else {
				let fileder = path.join(__dirname, "../../server", "/static/store/Comm/char");
				if (fs.existsSync(path.join(fileder, req.body.charId + "/" + req.body.actionId)))
				{
				res.end(fs.readFileSync(path.join(fileder, req.body.charId + "/" + req.body.actionId)));
				}
				else
				{
					fileder = path.join(__dirname, "../../_ASSETS");
					res.end(fs.readFileSync(path.join(fileder, req.body.actionId)));				
				}
			}
		}
	})
	.route("POST", "/goapi/getPointStatus/", (req, res) => {
		/*res.assert(
			req.body.userId,
			400, "Missing one or more fields."
		);*/
		res.setHeader("Content-Type", "application/xml");
		res.end(`0<?xml version="1.0" encoding="UTF-8"?>
		<points money="100000" sharing="100000"/>`);
	})
	.route("POST", "/goapi/buyPremiumAsset/", (req, res) => {
		res.assert(
			req.body.userId,
			400, "Missing one or more fields."
		);
		res.setHeader("Content-Type", "application/xml");
		res.end(`0<?xml version="1.0" encoding="UTF-8"?>
		<points money="1000" sharing="1000" />`);
	})
	.route("POST", "/goapi/getUserCharacterList/", (req, res) => {
		res.assert(
			req.body.userId,
			400, "Missing one or more fields."
		);
		const files = DB.select("assets", {type:"charugc"});
		let xmml = "";
		for (const file of files)
		{
		xmml += Char.createCharMeta(file.id,true);
		}
		res.setHeader("Content-Type", "application/xml");
		res.write(Buffer.alloc(1, 48));
		res.end(`<characters>${xmml}</characters>`);
	})
	.route("POST", "/goapi/setDefaultAction/", (req, res) => {
	const files = DB.select("assets", {type:"charugc"});
	for (const file of files)
		{
		if (file.id == req.body.characterId)
		{
		file.defaultaid = req.body.assetId;
		file.id = req.body.assetId;
		DB.update("assets",req.body.characterId,file);
		res.end("0");
		break;
		}
		}	
		res.end("1iguess");
	})
	.route("POST", "/goapi/saveCharacterAction/", (req, res) => {
		res.assert(
			req.files.Filedata,
			400, "1<error>poop?</error>"
		);
		const file = req.files.Filedata;
		const { filepath } = file;
		let data = filepath;
		const idi = fUtil.generateId();
		let writeStream = fs.createWriteStream(path.join(__dirname, "../../_ASSETS", idi + ".swf"));

		if (req.body.characterId)
		{
	    const info = DB.get("assets", req.body.characterId).data;
		console.log(info);
		info.idarray.push(idi);
		info.actionnames.push(req.body.actionName);
		DB.update("assets", req.body.characterId, info);
		}
		else
		{
		const template = {
		type: "charugc",
		subtype: 0,
		title: req.body.characterName,
		idarray: [idi],
		actionnames: [req.body.actionName],
		defaultaid: idi,
		id: idi
		};
		DB.insert("assets",template);
		}

			if (Buffer.isBuffer(data)) {
				writeStream.write(data, (e) => {
					if (e && e != null) res.end("error");
					res.end("0<char></char>")
				});
			} else {
				if (typeof data == "string") {
					// it's a file path
					data = fs.createReadStream(data);
					data.pause();
				}
				data.resume();
				data.pipe(writeStream);
				// wait for the stream to end
				data.on("end", () => {
					if (req.body.characterId) res.end(`0${Char.createCharMeta(req.body.characterId, true, true)}`);	
					else res.end(`0${Char.createCharMeta(idi, true, true)}`);	
				})
			}
		//fs.writeFileSync(path.join(__dirname, "../../_ASSETS","testfile.swf"), filepath);
	})
	// upload
	.route("*", "/api/char/upload", (req, res) => {
		const file = req.files.import;
		res.assert(file, 400, { status: "error" });
		const origName = file.originalFilename;
		const path = file.filepath, buffer = fs.readFileSync(path);

		const meta = {
			type: "char",
			subtype: 0,
			title: origName || "Untitled",
			themeId: Char.getTheme(buffer)
		};
		try {
			Char.save(buffer, meta, true);
			fs.unlinkSync(path);
			const url = `/cc_browser?themeId=${meta.themeId}`;
			res.redirect(url);
		} catch (e) {
			console.error("Error uploading character:", e);
			res.statusCode = 500;
			res.json({ status: "error" });
		}
	});

module.exports = group;
