/**
 * asset api
 */
// modules
const fs = require("fs");
const path = require("path");
let is2010 = false;
// vars
const folder = path.join(__dirname, "../../", process.env.ASSET_FOLDER);
// stuff
const database = require("../../data/database"), DB = new database();
const fUtil = require("../../utils/fileUtil");
const folder2 = path.join(__dirname, "../../", process.env.SAVED_FOLDER);

module.exports = {
	/**
	 * Deletes an asset.
	 * @param {string} id 
	 */
	delete(id) {
		const { type, subtype } = DB.get("assets", id).data;
		DB.delete("assets", id);

		if (type == "char") id += ".xml";
		fs.unlinkSync(path.join(folder, id));

		// delete video and char thumbnails
		if (
			type == "char" ||
			subtype == "video"
		) {
			const thumbId = id.slice(0, -3) + "png";
			fs.unlinkSync(path.join(folder, thumbId));
		}
	},

	/**
	 * Returns a buffer or stream. Throws an error if the asset doesn't exist.
	 * @param {string} id 
	 * @param {boolean} returnBuffer
	 * @returns {fs.ReadStream | Buffer}
	 */
	load(id, returnBuffer = false) {
		if (this.exists(id)) {
			const filepath = path.join(folder, id);
			let data;
			if (returnBuffer) {
				data = fs.readFileSync(filepath);
			} else {
				data = fs.createReadStream(filepath);
			}

			return data;
		} else {
			throw new Error("404");
		}
	},

	/**
	 * Checks if the file exists.
	 * @param {string} id 
	 * @returns {boolean}
	 */
	exists(id) {
		const filepath = path.join(folder, id);
		const exists = fs.existsSync(filepath);
		return exists;
	},
	/**
	 * Mods the char list to see if its zip or png
	 */
	checkV(v)
	{
	if (v == "2010")
	{
	is2010 = true;
	}
	else
	{
	is2010 = false;
	}
	},
	/**
	 * Converts an object to a metadata XML.
	 * @param {any[]} v 
	 * @returns {string}
	 */
	oldMeta2Xml(v)
	{
	let xml;
	const fold = path.join(__dirname, "../../", "_ASSETS");
	let usezip = fs.existsSync(path.join(fold, v.id + ".png")) ? true : false;
	xml = `<char id="${v.id}" thumb="${v.id}.zip" name="${v.title}" cc_theme_id="${v.themeId}" default="stand.xml" motion="walk.xml" enable="Y" copyable="Y" isCC="Y" locked="N" facing="left" published="0">
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
	<facial id="head_reallyangry.xml" name="Really angry" enable="Y"/>
	</char>`;
	return xml;
	},
	meta2Xml(v) {
		// sanitize stuff
		v.title = (v.title || "").replace(/"/g, "&quot;");

		let xml;
		switch (v.type) {
			case "char": {
				xml = `<char id="${v.id}" enc_asset_id="${v.id}" name="${v.title || "Untitled"}" cc_theme_id="${v.themeId}" thumbnail_url="/assets/${v.id}.png" copyable="Y"><tags>${v.tags || ""}</tags></char>`;
				break;
			} case "bg": {
				xml = `<background subtype="0" id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" asset_url="/assets/${v.id}"/>`
				break;
			} case "movie": {
				xml = `<movie id="${v.id}" enc_asset_id="${v.id}" path="/_SAVED/${v.id}" numScene="${v.sceneCount}" title="${v.title}" thumbnail_url="/file/movie/thumb/${v.id}"><tags></tags></movie>`;
				break;
			} case "prop": {
				if (v.subtype == "video") {
					xml = `<prop subtype="video"  id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" placeable="1" facing="left" width="${v.width}" height="${v.height}" asset_url="/assets/${v.id}" thumbnail_url="/assets/${v.id.slice(0, -3) + "png"}"/>`;
				} else {
					xml = `<prop wearable="0" published="${v.isshared == true ? "1" : "0"}" holdable="${v.subtype == 'handheld' ? 1 : 0}" id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" ${v.ptype}="1" tags="${v.tags}"facing="left" width="0" height="0" asset_url="/assets/${v.id}"/>`;
				}
				break;
			} case "sound": {
				xml = `<sound subtype="${v.subtype}" id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" duration="${v.duration}" downloadtype="progressive"/>`;
				break;
			}
		}
		return xml;
	},
	meta20Xml(v) {
		// sanitize stuff
		v.title = (v.title || "").replace(/"/g, "&quot;");

		let xml;
		switch (v.type) {
			case "char": {
				xml = `<char id="${v.id}" enc_asset_id="${v.id}" name="${v.title || "Untitled"}" cc_theme_id="${v.themeId}" thumbnail_url="/assets/${v.id}.png" copyable="Y"><tags>${v.tags || ""}</tags></char>`;
				break;
			} case "bg": {
				xml = `<background subtype="0" id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" asset_url="/assets/${v.id}"/>`
				break;
			} case "movie": {
				xml = `<movie id="${v.id}" enc_asset_id="${v.id}" path="/_SAVED/${v.id}" numScene="${v.sceneCount}" title="${v.title}" thumbnail_url="/file/movie/thumb/${v.id}"><tags></tags></movie>`;
				break;
			} case "prop": {
				if (v.subtype == "video") {
					xml = `<prop subtype="video" id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" placeable="1" facing="left" width="${v.width}" height="${v.height}" asset_url="/assets/${v.id}" thumbnail_url="/assets/${v.id.slice(0, -3) + "png"}"/>`;
				} else {
					xml = `<prop subtype="0" id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" ${v.ptype}="1" facing="left" width="0" height="0" asset_url="/assets/${v.id}"/>`;
				}
				break;
			} case "sound": {
				xml = `<sound subtype="${v.subtype}" id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" duration="${v.duration}" downloadtype="progressive"/>`;
				break;
			}
		}
		return xml;
	},
	meta2StoreXml(v) {
		let xml;
		switch (v.subtype) {
			case "bg": {
				xml = `<background id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" published="1"><tags></tags></background>`
				break;
			} case "prop": {
				xml = `<prop id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" holdable="0" wearable="0" placeable="1" published="1" facing="left" subtype="none"><tags></tags></prop>`;
				break;
			} case "char": {
				xml = `<char id="${v.id.slice(0, -4)}" name="Untitled" published="1" facing="left" thumb="${v.id}" default="${v.id}"><tags/></char>`
			}
		}
		return xml;
	},
	meta2StareXml(v) {
		let xml;
		switch (v.type) {
			case "bg": {
				xml = `<background id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" published="1"><tags></tags></background>`
				break;
			} case "prop": {
				xml = `<prop id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" holdable="0" wearable="0" placeable="1" published="1" facing="left" subtype="none"><tags></tags></prop>`;
				break;
			} case "movie": {
				xml = `<movie id="${v.id}" enc_asset_id="${v.id}" path="movie/${v.id}.png" numScene="${v.sceneCount}" title="${v.title}" thumbnail_url="/file/movie/thumb/${v.id}"><tags></tags></movie>`;
				break;
			}
			case "char": {
				xml = `<char id="${v.id.slice(0, -4)}" name="Untitled" published="1" facing="left" thumb="${v.id}" default="${v.id}"><tags/></char>`
			}
		}
		return xml;
	},
	meta2VideoXml(v) {
		let xml;
		xml = `<prop subtype="video" id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" placeable="1" facing="left" width="${v.width}" height="${v.height}" asset_url="/assets/${v.id}" thumbnail_url="/assets/${v.id.slice(0, -3) + "png"}"/>`;
		return xml;
	},
	/**
	 * Saves an asset.
	 * @param {fs.ReadStream | Buffer | string} data 
	 * @param {string} ext
	 * @param {object} info 
	 * @returns {string}
	 */
	save(data, ext, info) {
		return new Promise((res, rej) => {
			if (ext.includes(".")) {
				info.id = ext;
			} else {
				info.id = `${fUtil.generateId()}.${ext}`;
			}
			DB.insert("assets", info)
			// save the file
			let writeStream = fs.createWriteStream(path.join(folder, info.id));
			let writeStream2 = fs.createWriteStream(path.join(folder2, 'propAssetId.txt'));


			if (Buffer.isBuffer(data)) {
				writeStream.write(data, (e) => {
					if (e && e != null) rej(e);
					res(info.id);
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
					writeStream2.write(info.id, () => {
						writeStream2.close();
						res(info.id);
					});
				});
			}
		});
	}
};