/**
 * powerpoint notes
 */
const fs = require("fs");
const httpz = require("@octanuary/httpz");
const path = require("path");

const group = new httpz.Group();
group
	// load
	.route("POST", "/api/upload/powerpoint", (req, res) => {
    const AdmZip = require("adm-zip");
    const pathas = req.files.pp.filepath, buffer = fs.readFileSync(pathas);
    const sfolder = path.join(__dirname, "../../server", "/static/store");
    if (!fs.existsSync(path.join(sfolder, "extracted_pp")))
	{
    fs.mkdirSync(path.join(sfolder, "extracted_pp"));
    }
    const zip = new AdmZip(buffer);
    zip.extractAllTo(path.join(sfolder, "extracted_pp"));
    res.statusCode = "501";
    res.json({"status":"imcomplete","message":"Not implemented"});
	});
module.exports = group;