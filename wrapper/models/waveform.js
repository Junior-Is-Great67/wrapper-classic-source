/**
 * waveform api
 */
// modules
const fs = require("fs");
const path = require("path");
// vars
const folder = path.join(__dirname, "../../", process.env.CACHE_FOLDER);

module.exports = {
	/**
	 * Looks for a match in the _CACHÉ folder.
	 * If there's no match found, it returns null.
	 * @param {string} id 
	 * @returns {Buffer | null}
	 */
	load(id) { // look for match in folder
		const match = fs.readdirSync(folder)
			.find(file => file.includes(`${id}.wf`));
		return match ? fs.readFileSync(path.join(folder, match)) : null;
	},

	/**
	 * Saves the waveform to the _CACHE folder.
	 * @param {Buffer} wf 
	 * @param {string} id 
	 * @returns {boolean}
	 */
	save(wf, id) {
		fs.writeFileSync(path.join(folder, `${id}.wf`), wf);
		return true;
	}
};