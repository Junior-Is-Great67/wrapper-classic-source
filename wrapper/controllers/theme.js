/**
 * theme routes
 */
// modules
const httpz = require("@octanuary/httpz");
const path = require("path");
const fs = require("fs");
// vars
const folder = path.join(__dirname, "../../server", "/store/3a981f5cb2739137");
const sfolder = path.join(__dirname, "../../server", "/static/store");
const nodezip = require("node-zip");
// stuff
const database = require("../../data/database"), DB = new database(true);
const fUtil = require("../../utils/fileUtil");

// create the group
const group = new httpz.Group();
//STEAM TO BRUFFER
function stream2Buffer(readStream) {
	return new Promise((res, rej) => {
		let buffers = [];
		readStream.on("data", (c) => buffers.push(c));
		readStream.on("end", () => res(Buffer.concat(buffers)));
	});
}
function meta2Xml(v) {
	let xml;
	let ty = v._attributes.type;
	if (v._attributes.cc_theme_id === undefined && !v._attributes.name.toString().includes("&"))
	{
	xml = `<theme id="${v._attributes.id}" name="${v._attributes.name}" thumb="" />`;
	}
	else if (!v._attributes.name.toString().includes("&"))
	{
	xml = `<theme id="${v._attributes.id}" name="${v._attributes.name}" cc_theme_id="${v._attributes.cc_theme_id}" thumb="" />`;	
	}
	else
	{
	let guy = v._attributes.name.toString();
	console.log(guy)
	console.log("OH MY GOD I HATE THIS " + guy.indexOf("&"));
	let part1 = v._attributes.name.slice(0, guy.indexOf("&"));
	let part2 = v._attributes.name.substring(guy.indexOf("&") + 1);
	xml = `<theme id="${v._attributes.id}" name="${part1}&amp;${part2}" thumb="" />`;	
	}
	return xml;
}
group
	// list
	.route("POST", "/goapi/getThemeList/", async (req, res) => {
		const truncated = DB.select().TRUNCATED_THEMELIST;
		if (req.body.v != "2016") {
			if (req.body.v == "2010") {
				let filepath = "themelist-2010.xml";
				if (req.body.ctc == "domo") filepath = "themelist-domo.xml";
				const xmlPath = path.join(folder, filepath);
				const zip = await fUtil.zippy(xmlPath, "themelist.xml");
				res.setHeader("Content-Type", "application/zip");
				res.end(zip);

			}
			else if (req.body.v != "2011" && req.body.v != "2012") {
				const filepath = truncated ?
					"themelist-old.xml" :
					"themelist-old-allthemes.xml";
				const xmlPath = path.join(folder, filepath);
				const zip = await fUtil.zippy(xmlPath, "themelist.xml");
				res.setHeader("Content-Type", "application/zip");
				res.end(zip);
			}
			else {
				const filepath = "themelist-old-2012.xml";
				const xmlPath = path.join(folder, filepath);
				const zip = await fUtil.zippy(xmlPath, "themelist.xml");
				res.setHeader("Content-Type", "application/zip");
				res.end(zip);
			}

		}
		else {
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
		let xmlPath;
		if (id == "common") {
			if (req.body.v != "2010" && req.body.v != "2011") xmlPath = path.join(sfolder, `${id}/theme.xml`);
			else xmlPath = path.join(sfolder, `${id}/theme-2011.xml`);
		}
		else if (id == "custom") {
			if (parseInt(req.body.v) < 2013) xmlPath = path.join(sfolder, `${id}/theme.xml`);
			else xmlPath = path.join(sfolder, `${id}/themeaaa.xml`);
		}
		else
		{
		xmlPath = path.join(sfolder, `${id}/theme.xml`);
		}
		const zip = await fUtil.zippy(xmlPath, "theme.xml");
		console.log("MADE IT!!!!!!");
		res.setHeader("Content-Type", "application/zip");
		res.end(zip);
	})
	.route("*", /^\/static\/store\/([^/]+)\/([^/]+)\.zip$/, async (req, res) => {
	console.log(req.matches[1]);
	let xmlPath = path.join(sfolder, `${req.matches[1]}/theme.xml`);
	res.end(await fUtil.zippy(xmlPath, "theme.xml"));
	})

	.route("POST", "/api/theme/add", async (req, res) => {
		const AdmZip = require("adm-zip");
		var convert = require('xml-js');
		let themeid = req.files.theme.originalFilename.slice(0, -4);
		const pathas = req.files.theme.filepath, buffer = fs.readFileSync(pathas);
		if (!fs.existsSync(path.join(sfolder, themeid)))
		{
		const zip = new AdmZip(buffer);
		zip.extractAllTo(path.join(sfolder));
		// Yeah lets get themelist so mod time yay
		let xnl = fs.readFileSync(path.join(folder, "themelist.xml"));
		let result = convert.xml2json(xnl, { compact: true, spaces: 4 });
		let test = JSON.parse(result);
		const themeArray = test.list.theme;
		let mappedGuy = ""
		mappedGuy += `<?xml version="1.0" encoding="UTF-8"?>
		<list version="1.0">`;
		mappedGuy = themeArray.map(meta2Xml).join("");
		if (!fs.existsSync(path.join(sfolder, themeid, "theme.xml")))
		{
		res.redirect("/?themeuploaded=majorfail");
		}
		let themexml = fs.readFileSync(path.join(sfolder, themeid, "theme.xml"))
		let result2 = convert.xml2json(themexml.toString(), { compact: true, spaces: 4 });
		let test2 = JSON.parse(result2);
		//Add the new theme
		mappedGuy += `<theme id="${test2.theme._attributes.id}" name="${test2.theme._attributes.name}" thumb="" />`;
		mappedGuy += `<word></word>
		<whiteword />
		<excludeAssetIDs />
		<points money="100" sharing="100" />
		</list>`;
		fs.writeFileSync(path.join(folder, "themelist.xml"), Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
		<list version="1.0"> ${mappedGuy}`));
		//Time to do it all over again (but with big one)
		let xml = fs.readFileSync(path.join(folder, "themelist-allthemes.xml"));
		let resultz = convert.xml2json(xml, { compact: true, spaces: 4 });
		let testz = JSON.parse(resultz);
		const themeArrayz = testz.list.theme;
		let mappedGuyz = ""
		mappedGuyz += `<?xml version="1.0" encoding="UTF-8"?>
		<list version="1.0">`;
		mappedGuyz = themeArrayz.map(meta2Xml).join("");
		let themexmlz = fs.readFileSync(path.join(sfolder, themeid, "theme.xml"));
		let result2z = convert.xml2json(themexmlz.toString(), { compact: true, spaces: 4 });
		let test2z = JSON.parse(result2z);
		//Add the new theme
		mappedGuyz += `<theme id="${test2z.theme._attributes.id}" name="${test2z.theme._attributes.name}" thumb="" />`;
		mappedGuyz += `<word></word>
		<whiteword />
		<excludeAssetIDs />
		<points money="100" sharing="100" />
		</list>`;
		fs.writeFileSync(path.join(folder, "themelist-allthemes.xml"), Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
		<list version="1.0"> ${mappedGuyz}`));
		res.redirect(`http://localhost:4343/?themeuploaded=success`);
		}
		else
		{
		res.redirect(`http://localhost:4343/?themeuploaded=failed`);
		}
		console.log("Oh boy here we go");
		/*res.setHeader("Content-Type", "application/zip");
		res.end(zip);*/
	})

module.exports = group;
