/**
 * theme routes
 */
// modules
const httpz = require("@octanuary/httpz");
const path = require("path");
// vars
const folder = path.join(__dirname, "../../server", "/store/3a981f5cb2739137");
const sfolder = path.join(__dirname, "../../server", "/static/store");
// stuff
const database = require("../../data/database"), DB = new database(true);
const fUtil = require("../../utils/fileUtil");

// create the group
const group = new httpz.Group();

group
	// list
	.route("POST", "/goapi/getThemeList/", async (req, res) => {
		const truncated = DB.select().TRUNCATED_THEMELIST;
		if (req.body.v != "2016")
		{
			if (req.body.v == "2010")
			{		const filepath = "themelist-2010.xml";
			const xmlPath = path.join(folder, filepath);
			const zip = await fUtil.zippy(xmlPath, "themelist.xml");
			res.setHeader("Content-Type", "application/zip");
			res.end(zip);}
			else
			{		const filepath = truncated ? 
				"themelist-old.xml" : 
				"themelist-old-allthemes.xml";
			const xmlPath = path.join(folder, filepath);
			const zip = await fUtil.zippy(xmlPath, "themelist.xml");
			res.setHeader("Content-Type", "application/zip");
			res.end(zip);}

		}
		else
		{
			const filepath = truncated ? 
			"themelist.xml" : 
			"themelist-allthemes.xml";
		const xmlPath = path.join(folder, filepath);
		const zip = await fUtil.zippy(xmlPath, "themelist.xml");
		res.setHeader("Content-Type", "application/zip");
		res.end(zip);		
		}
	})
	// load
	.route("POST", "/goapi/getTheme/", async (req, res) => {
		const id = req.body.themeId;
		res.assert(id, 500, "Missing one or more fields.");
		console.log("everything made it here. " + id);
		const xmlPath = path.join(sfolder, `${id}/theme.xml`);
		const zip = await fUtil.zippy(xmlPath, "theme.xml");
		console.log("MADE IT!!!!!!");
		res.setHeader("Content-Type", "application/zip");
		res.end(zip);
	})

module.exports = group;
