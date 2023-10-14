/**
 * wrapper's routes
 */
// modules
const httpz = require("@octanuary/httpz");
// stuff
const app = require("./app");
const asset = require("./asset");
const char = require("./char");
const movie = require("./movie");
const update = require("./update");
const theme = require("./theme");
const settings = require("./settings");
const tts = require("./tts");
const watermark = require("./watermark");
const waveform = require("./waveform");
const powerpoint = require("./powerpoint");

// create the group
const group = new httpz.Group();

group
	// add all the routes
	.add(app)
	.add(asset)
	.add(char)
	.add(movie)
	.add(update)
	.add(theme)
	.add(settings)
	.add(tts)
	.add(watermark)
	.add(waveform)
	.add(powerpoint);

module.exports = group;
