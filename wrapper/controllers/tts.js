/**
 * tts routes
 */
// modules
const fs = require("fs");
const httpz = require("@octanuary/httpz");
const tempfile = require("tempfile");
// vars
const info = require("../data/voices");
// stuff
const Asset = require("../models/asset");
const fileUtil = require("../../utils/realFileUtil");
const processVoice = require("../models/tts");
const path = require("path");

// create the group
const group = new httpz.Group();

/*
 * generate the list
 */
const voices = info.voices, langs = {};
Object.keys(voices).forEach((i) => {
	const v = voices[i], l = v.language;
	langs[l] = langs[l] || [];
	langs[l].push(`<voice id="${i}" desc="${v.desc}" sex="${v.gender}" demo-url="" country="${v.country}" plus="N"/>`);
});
const xml = `${process.env.XML_HEADER}<voices>${
	Object.keys(langs).sort().map(i => {
		const v = langs[i], l = info.languages[i];
		return `<language id="${i}" desc="${l}">${v.join('')}</language>`;
	}).join('')}</voices>`;


	const uvoices = info.voices, ulangs = {};
	Object.keys(uvoices).forEach((i) => {
		const v = uvoices[i], l = v.language;
		ulangs[l] = ulangs[l] || [];
		ulangs[l].push(`<voice id="${i}" desc="${v.desc}" sex="${v.gender}" demo-url="" country="${v.country}" plus="N"/>`);
	});
	const uxml = `${process.env.XML_HEADER}<voices credit="50">${
		Object.keys(ulangs).sort().map(i => {
			const v = ulangs[i], l = info.languages[i];
			return `<language id="${i}" desc="${l}">${v.join('')}</language>`;
		}).join('')}</voices>`;

group
	// list
	.route("POST", "/goapi/getTextToSpeechVoices/", (req, res) => {
		//const fold = path.join(__dirname, "../../", "wrapper/data");
		//const xmlPath = path.join(fold, "voice.xml");
		//const yml = fs.readFileSync(xmlPath)
		res.setHeader("Content-Type", "text/html; charset=UTF-8");
		res.end(xml);
	})
	.route("POST", "/ajax/getTTSList", (req, res) => {
		let availablelang = [];
		let voices_en = [];
		let voices_es = [];
		let voices_pt = [];
		let voices_more = [];
		let lang = info.languages;
		//Filter the voices
		for (const a of Object.keys(lang))
		{
		if (a == "en" || a == "es" || a == "pt")
		{
		availablelang.push(a);
		}
		}
		let voice = info.voices;
		Object.keys(voices).forEach((i) => {
			const a = voices[i];
		if (a.language == "en")
		{
		voices_en.push({id:i,desc:a.desc,vendor:a.source,sex:a.gender,demo:"",lang:a.language,country:a.country,plus:false});
		}
		else if (a.language == "es")
		{
		voices_es.push({id:i,desc:a.desc,vendor:a.source,sex:a.gender,demo:"",lang:a.language,country:a.country,plus:false});
		}
		else if (a.language == "pt")
		{
		voices_pt.push({id:i,desc:a.desc,vendor:a.source,sex:a.gender,demo:"",lang:a.language,country:a.country,plus:false});
		}
		else
		{
		voices_more.push({id:i,desc:a.desc,vendor:a.source,sex:a.gender,demo:"",lang:a.language,country:a.country,plus:false});
		}
		});
		voices_en.sort(function(a, b) {
			var textA = a.desc.toUpperCase();
			var textB = b.desc.toUpperCase();
			return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		});
		availablelang.push("more");
		res.json({en:{desc:"English", options:voices_en},es:{desc:"Spanish", options:voices_es},pt:{desc:"Portguese", options:voices_pt},default:{desc:"More", options:voices_more}})
	});

module.exports = group;
