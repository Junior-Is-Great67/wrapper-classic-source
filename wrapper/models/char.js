/**
 * character api
 */
// modules
const fs = require("fs");
const path = require("path");
// vars
const baseUrl = path.join(__dirname, "../../", process.env.CHAR_BASE_URL);
const folder = path.join(__dirname, "../../", process.env.ASSET_FOLDER);
const fileder = path.join(__dirname, "../../server", "/static/store/Comm/char");
// stuff
const database = require("../../data/database"), DB = new database();
const fUtil = require("../../utils/fileUtil");

module.exports = {
	/**
	 * Tries to find a character in the _SAVED folder. If there's no match, it tries to find it in the character dump.
	 * @param {string} id
	 * @returns {Promise<Buffer>}
	 */
	load(id) {
		console.log(id);
		try {
			try { // custom characters
				return fs.readFileSync(path.join(folder, `${id}.xml`));
			} catch (err) { // stock characters
				const nId = (id.slice(0, -3) + "000").padStart(9, 0);
				const chars = fs.readFileSync(path.join(baseUrl, `${nId}.txt`));

				const line = chars
					.toString("utf8")
					.split("\n")
					.find((v) => v.substring(0, 3) == id.slice(-3));
				if (line) {
					return Buffer.from(line.substring(3));
				}
				console.log(new Error("Character not found."));
				return "1";
			}
		} catch (err) {
			console.log(new Error("Character not found."));
			return "1";
		}
	},
	/**
	 * Parses a ugc character, used in older builds for comedy world and comm stuff
	 * @param {string} id
	 * @returns {string}
	 */
	parseUgcChar(id) {
		if (this.load(id) == "1") {
			let isCustomChar = false;
			console.log(id);
			console.log("here");
			const files = DB.select("assets", {type:"charugc"});
			for (const file2 in files) {
				if (files[file2].id == id) {
					isCustomChar = true;
					break;
				}
			}
			let xnl;
			if (!isCustomChar) xnl = fs.readFileSync(path.join(__dirname, "../../server", "/static/store/Comm", "theme.xml")).toString();
			else xnl = this.createCharMeta(id);
			const xmlJs = require('xml-js');
			function jsonToXml(jsonData) {
				const options = {
					compact: true,
					ignoreComment: true,
					spaces: 4
				};
				return xmlJs.js2xml(jsonData, options);
			}
			let meta = "";
			let result = xmlJs.xml2json(xnl, { compact: true, spaces: 4 });
			const data = JSON.parse(result);
			let hasmatch = false;
			if (data.theme.char[0] !== undefined)
			{
			console.log("going here?");
			for (let i = 0; i < data.theme.char.length; i++) {
				num = i;
				console.log(data.theme.char[i]._attributes.id);
				if (data.theme.char[i]._attributes.id == id) {
					hasmatch = true;
					meta = jsonToXml({ char: data.theme.char[i] });
				}
			}
			}
			else
			{
					console.log(data.theme.char._attributes.id);
					if (data.theme.char._attributes.id == id) {
						hasmatch = true;
						meta = jsonToXml({ char: data.theme.char });
				}
			}
			if (hasmatch) {
				console.log(meta);
				return meta;
			}
		}
		else {
			console.log("return");
			return `<char id="${id}" thumb="${id}.zip" name="Untitled" cc_theme_id="family" default="stand.xml" motion="walk.xml" enable="Y" copyable="Y" isCC="Y" locked="N" facing="left" published="0">
		<tags>untitled</tags>
		<action id="stand.xml" name="Stand" loop="Y" totalframe="1" is_motion="N" enable="Y"/>
		<action id="excited.xml" name="Excited" loop="Y" totalframe="1" is_motion="N" enable="Y"/>
		<action id="xarmseve.xml" name="Crossed Arms (eve)" loop="Y" totalframe="1" is_motion="N" enable="Y"/>
		<action id="xarms.xml" name="Crossed Arms" loop="Y" totalframe="1" is_motion="N" enable="Y"/>
		<motion id="walk.xml" name="Walk" loop="Y" totalframe="24" is_motion="Y" enable="Y"/>
		<facial id="head_talk_a.xml" name="Talk" enable="Y"/>
		<facial id="head_angry.xml" name="Angry" enable="Y"/>
		<facial id="head_evilsmile.xml" name="Evil Smile" enable="Y"/>
		<facial id="head_shocked.xml" name="Shocked" enable="Y"/>
		<facial id="head_neutral.xml" name="Neutral" enable="Y"/>
		<facial id="head_sad.xml" name="Sad" enable="Y"/>
		</char>`
		}
	},
	/**
	 * Creates an XML for a custom character (not cc themes)
	 * @param {string} id The Asset Id for the character
	 * @returns {string}
	 */
	createCharMeta(id,truncate = false, includeActions = false) {
		let xmlMeta = `<theme id="ugc">`;
		if (truncate) xmlMeta = "";
		const files = DB.select("assets", { type: "charugc" });
		for (const v of files) {
			if (v.id == id)
			{
			xmlMeta += `<char id="${v.id}" name="${v.title}" published="1" facing="left" thumb="${v.defaultaid}.swf" default="${v.defaultaid}.swf"${truncate && !includeActions ? "/" : "" }>`;
			if (!truncate || includeActions)
			{
			for (var b = 0; b < v.idarray.length; b++) {
				xmlMeta += `<action id="${v.idarray[b]}.swf" name="${v.actionnames[b]}"/>`;
			}
			}
			if (!truncate || includeActions) xmlMeta += `</char>`;
			}
		}
		if (!truncate) xmlMeta += `</theme>`;
		return xmlMeta;
	},
	/**
	 * saves the character and its metadata
	 * @param {Buffer} buf a buffer of a character xml
	 * @param {object} info character metadata, must contain type, subtype, title, and themeId
	 * @param {boolean} isV2 specifies if the 'version="2.0"' should be added to the xml
	 * @returns {string}
	 */
	save(buf, info, isV2 = false) {
		// save asset info
		info.id = fUtil.generateId();
		DB.insert("assets", info);

		// fix handheld props for freeaction themes
		if (this.isFA(info.themeId) && !isV2) {
			const end = buf.indexOf(">", buf.indexOf("<cc_char"));
			buf = Buffer.concat([
				buf.subarray(0, end),
				Buffer.from(" version=\"2.0\""),
				buf.subarray(end)
			]);
		}

		// save the file
		fs.writeFileSync(path.join(folder, `${info.id}.xml`), buf);
		return info.id;
	},
	/**
		 * Converts an object to a metadata XML.
		 * @param {any[]} v 
		 * @returns {string}
		 */
	meta2colourXml(v) {
		let xml;
		if (v._attributes.oc === undefined && !v._attributes.targetComponent) {
			xml = `<color r="${v._attributes.r}">${v._text}</color>`;
		}
		else if (v._attributes.targetComponent === undefined) {
			xml = `<color r="${v._attributes.r}" oc="${v._attributes.oc}">${v._text}</color>`;
		}
		else {
			xml = `<color r="${v._attributes.r}" targetComponent="${v._attributes.targetComponent}">${v._text}</color>`;
		}
		return xml;
	},
	/**
	 * saves a character thumbnail
	 * @param {string} id the character id
	 * @param {Buffer} thumb a thumbnail of the character in PNG format
	 * @param {Buffer} head a thumbnail of the character head in PNG format
	 * @returns {void}
	 */
	saveThumb(id, thumb, head) {
		fs.writeFileSync(path.join(folder, `${id}.png`), thumb);
		fs.writeFileSync(path.join(folder, `${id}_head.png`), head);
		return;
	},

	/**
	 * Looks for a theme in a character XML.
	 * @param {Buffer} buffer
	 * @returns {string}
	 */
	getTheme(buffer) {
		const beg = buffer.indexOf(`theme_id="`) + 10;
		const end = buffer.indexOf(`"`, beg);
		return buffer.subarray(beg, end).toString();
	},

	/**
	 * Checks if a cc_theme is a freeaction theme.
	 * @param {string} themeId 
	 * @returns {boolean}
	 */
	isFA(themeId) {
		switch (themeId) {
			case "cctoonadventure":
			case "family":
				return false;
		}
		return true;
	}
}