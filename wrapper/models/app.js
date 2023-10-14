/**
 * app routes
 */
// modules
const httpz = require("@octanuary/httpz");
let discord;
require("../../utils/discord")
	.then((f) => discord = f);
// vars
const { SWF_URL, STORE_URL, CLIENT_URL } = process.env;
let usrid = "";
// stuff
const database = require("../../data/database"), DB = new database(true);
const reqIsStudio = require("../middlewares/req.isStudio");
const { VERSION } = DB.select();
const typ = VERSION;
function toAttrString(table) {
	return typeof (table) == "object" ? new URLSearchParams(table).toString() : table.replace(/"/g, "\\\"");
}
function toParamString(table) {
	return Object.keys(table).map(key =>
		`<param name="${key}" value="${toAttrString(table[key])}">`
	).join(" ");
}
function toObjectString(attrs, params) {
	return `<object id="obj" ${Object.keys(attrs).map(key =>
		`${key}="${attrs[key].replace(/"/g, "\\\"")}"`
	).join(" ")}>${toParamString(params)}</object>`;
}
//Double check because it freakin hates me
// create the group
const group = new httpz.Group();

group
	.add(reqIsStudio)
	// video list
	.route("*", "/", (req, res) => {
		discord("Video List");
		res.render("list", {});
	})
	.route("*", "/youtube", (req, res) => {
		discord("Old Youtube");
		res.render("UTube", {});
	})
	.route("*", "/go/gib", (req, res) => {
		discord("Video List");
		res.redirect(`/go_full?tray=Comm`);
	})
	.route("*", "/make", (req, res) => {
		discord("Making a Character");
		res.render("make", {});
	})
	.route("*", "/character_creator", (req, res) => {
		discord("Character Creator");
		res.redirect(`/oldcc?themeId=family`);
	})
	.route("*", "/logOut", (req, res) => {
		res.render("logOut", {});
	})
	.route("*", "/reflex", (req, res) => {
		res.render("app/My testing is my japanese", {});
	})
	// settings
	.route("*", "/settings", (req, res) => {
		discord("Settings");
		res.render("settings", {});
	})
	// themelist page
	.route("GET", "/create", (req, res) => {
		discord("Choosing a Theme");
		res.render("create", {});
	})
	.route("GET", "/watch", (req, res) => {
		discord("WATCHING A VIDEO ON WRAPPER JYVEE EDITION RETRO!!!");
		res.render("watch", {});
	})
	.route("GET", "/logIn", (req, res) => {
		discord("Video List");
		res.render("logIn", {});
	})
	// flash pages
	.route("GET", "/oldcc", async (req, res) => {
		checkMe();
		const { VERSION } = DB.select();
		const { CLIENT_THEME } = DB.select();
		discord("Character Creator");
		let flashvars = {
			appCode: "go",
			ctc: CLIENT_THEME,
			isEmbed: 1,
			isLogin: "Y",
			userName: "Jerry",
			userEmail: "jerryguy69420@gmail.com",
			userId: usrid,
			m_mode: "school",
			page: "",
			siteId: "go",
			tlang: "en_US",
			ut: 40,
			lid: 7,
			// options
			bs: "adam",
			original_asset_id: req.query["id"] || "",
			themeId: "family",
			// paths
			apiserver: "http://localhost:4343/",
			storePath: process.env.STORE_URL + "/<store>",
			clientThemePath: "http://localhost:4343/static/tommy/<client_theme>"
		};
		Object.assign(flashvars, req.query);
		res.render("app/char", {
			title: "Character Creator",
			attrs: {
				data: "http://localhost:4343/animation/" + VERSION + "/cc_old.swf",
				type: "application/x-shockwave-flash",
				id: "char_creator",
				width: "960",
				height: "600",
				class: "char_object"
			},
			params: {
				flashvars,
				allowScriptAccess: "always",
				movie: "http://localhost:4343/animation/" + VERSION + "/cc_old.swf",
			},
			object: toObjectString
		});
	})
	.route("GET", "/cc", async (req, res) => {
		checkMe();
		const guy = checkMe2();
		discord("Character Creator");
		const { IS_LOGGED_IN } = DB.select();
		const { CLIENT_THEME } = DB.select();
		let flashvars = {
			appCode: "go",
			ctc: "go",
			isLogin: "Y",
			lid: 7,
			ut: 50,
			nextUrl: "/",
			siteId: "go",
			themeId: "sf",
			tlang: "en_US",
			uisa: 1,
			userId: 4843,
			apiserver: "http://localhost:4343/",
			storePath: STORE_URL + "/<store>",
			clientThemePath: "http://localhost:4343/static/tommy/" + guy + "/<client_theme>",
		};
		Object.assign(flashvars, req.query);
		res.render("app/char", {
			title: "Character Creator",
			attrs: {
				data: "http://localhost:4343/animation/" + guy + "/cc_old.swf",
				type: "application/x-shockwave-flash",
				id: "char_creator",
				width: "960",
				height: "600",
				class: "char_object"
			},
			params: {
				flashvars,
				allowScriptAccess: "always",
				movie: "http://localhost:4343/animation/" + guy + "/cc_old.swf",
			},
			object: toObjectString
		});
	})
	.route("GET", "/cc_browser", async (req, res) => {
		checkMe();
		discord("Character Browser");
		const { IS_LOGGED_IN } = DB.select();
		let flashvars = {
			appCode: "go",
			ctc: "go",
			isEmbed: 1,
			isLogin: "Y",
			m_mode: "school",
			page: "",
			siteId: "go",
			tlang: "en_US",
			ut: IS_LOGGED_IN,
			// options
			themeId: "family",
			// paths
			apiserver: "http://localhost:4343/",
			storePath: "http://localhost:4343/static/store/<store>",
			clientThemePath: CLIENT_URL + "/<client_theme>"
		};
		Object.assign(flashvars, req.query);
		res.render("app/char", {
			title: "Character Browser",
			attrs: {
				data: SWF_URL + "/cc_browser.swf",
				type: "application/x-shockwave-flash",
				id: "char_creator",
				width: "100%",
				height: "600",
				class: "char_object"
			},
			params: {
				flashvars,
				allowScriptAccess: "always",
				movie: SWF_URL + "/cc.swf",
			},
			object: toObjectString
		});
	})
	//Old go_full!
	.route("GET", "/old_full", async (req, res) => {
		checkMe();
		const { CLIENT_THEME } = DB.select();
		console.log(CLIENT_THEME)
		let goCtc = false;
		if (CLIENT_THEME != "go") {
			goCtc = true;
		}
		console.log(goCtc);
		const guy = checkMe2();
		const { IS_WIDE } = DB.select();
		const pointsEnabled = goCtc ? 0 : 1;
		const { IS_LOGGED_IN } = DB.select();
		discord(guy + " Video Maker");
		let flashvars = {
			tts_enabled: 1,
			upl: 1,
			hb: 1,
			credits: 100,
			ctc: CLIENT_THEME,
			appCode: "go",
			uisa: 1,
			isLogin: "Y",
			siteId: "11",
			tray: "retro",
			tlang: "en_US",
			isVideoRecord: 1,
			userId: usrid,
			m_mode: "Y",
			isWide: IS_WIDE,
			tutorial: 0,
			stutype: "tiny_studio",
			nextUrl: "http://localhost:4343/",
			gocoins: 100,
			lid: 13,
			ut: IS_LOGGED_IN,
			pts: pointsEnabled,
			apiserver: "http://localhost:4343/",
			animationPath: "http://localhost:4343/animation/" + guy + "/",
			storePath: "http://localhost:4343/static/store/<store>",
			clientThemePath: `http://localhost:4343/static/tommy/${guy}/<client_theme>`
		};
		Object.assign(flashvars, req.query);
		res.render("app/oldstudio", {
			attrs: {
				data: "http://localhost:4343/animation/" + guy + "/old_full.swf",
				type: "application/x-shockwave-flash", width: "100%", height: "100%",
			},
			params: {
				flashvars,
				allowScriptAccess: "always",
			},
			object: toObjectString
		});
	})
	.route("GET", "/go_full", async (req, res) => {
		checkMe();
		discord("2016 Video Maker");
		const { IS_WIDE } = DB.select();
		let path;
		if (req.query.v == "2015")
		{
		path = "/animation/2015";
		}
		else
		{
		path = SWF_URL;		
		}
		const { IS_LOGGED_IN } = DB.select();
		let flashvars = {
			tts_enabled: true,
			uisa: 1,
			userName: "Jerry",
			userEmail: "jerryguy69420@gmail.com",
			userId: usrid,
			appCode: "go",
			collab: 1,
			ctc: "go",
			goteam_draft_only: 1,
			isLogin: "Y",
			siteId: "11",
			isWide: IS_WIDE,
			skoletube: 1,
			lid: 0,
			nextUrl: "/",
			page: "",
			retut: 1,
			tray: "custom",
			tlang: "en_US",
			ut: IS_LOGGED_IN,
			apiserver: "http://localhost:4343/",
			storePath: "http://localhost:4343/static/store/<store>",
			clientThemePath: CLIENT_URL + "/<client_theme>"
		};
		Object.assign(flashvars, req.query);
		res.render("app/studio", {
			attrs: {
				data: path + "/go_full.swf",
				type: "application/x-shockwave-flash", width: "100%", height: "100%",
			},
			params: {
				flashvars,
				allowScriptAccess: "always",
			},
			object: toObjectString
		});
	})
	.route("GET", "/player", async (req, res) => {
		checkMe();
		discord("Video Player");
		const { IS_WIDE } = DB.select();
		const { IS_LOGGED_IN } = DB.select();
		let flashvars = {
			userName: "Jerry",
			userEmail: "jerryguy69420@gmail.com",
			userId: "guythis",
			lid: 7,
			siteId: "go",
			autostart: 1,
			isWide: IS_WIDE,
			ut: IS_LOGGED_IN,
			thumbnailURL: "http://localhost:4343/file/movie/thumb/" + req.query.movieId,
			apiserver: "http://localhost:4343/",
			storePath: "http://localhost:4343/static/store/<store>",
			clientThemePath: CLIENT_URL + "/<client_theme>"
		};
		Object.assign(flashvars, req.query);
		res.render("app/player", {
			attrs: {
				data: SWF_URL + "/player.swf",
				type: "application/x-shockwave-flash", width: "100%", height: "100%",
			},
			params: {
				flashvars,
				allowScriptAccess: "always",
			},
			object: toObjectString
		});
	});
module.exports = group;

function checkMe() {
	const { IS_LOGGED_IN } = DB.select();
	if (IS_LOGGED_IN == 60) {
		usrid = "e9Vusx9Gv8";
	}
	else {
		usrid = "";
	}
}

function checkMe2() {
	const { SELECTION } = DB.select();
	const { SELSION } = DB.select();
	const { VERSION } = DB.select();
	if (SELECTION == true) {
		return SELSION;
	}
	else {
		return VERSION;
	}
}