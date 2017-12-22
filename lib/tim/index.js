/** ------------------------------------------------------------------------------------------------
 *  tim.js
 *  ------
 *  Tim "The Toolman" is brikcss's utility toolbelt. Your wish is his command.
 *  @author  brikcss  <https://github.com/brikcss>
 *  @description  Tim "The Toolman" is brikcss's task runner and utility toolbelt, used in creating and maintaining brikcss front end components.
 ** --------------------------------------------------------------------------------------------- */

// -------------------
// Set up environment.
//
const logger = require('loglevel');
logger.setLevel(process.env.LOG || 'info');

// -------------------
// Set up default tim.
// ---
// Each string property is the path for a node require, which is required the first time that property is accessed.
// IMPORTANT: Do not do any node requires here. Instead add the string path here or place the require inside the function tim will access later on.
//
const tim = {
	// Custom scripts.
	config: '../config',
	boot: '../boot',
	sass: '../sass',
	shots: '../shots',
	js: '../js',
	// Cli tools.
	log: logger,
	logify: logify,
	shell: 'shelljs',
	minimist: 'minimist',
	// Test tools.
	assert: 'assert',
	chokidar: 'chokidar',
	// File manipulation tools.
	fs: 'fs-extra',
	path: 'path-extra',
	rm: 'rimraf',
	globby: 'globby',
	minimatch: 'minimatch',
	// File compilation tools.
	ejs: 'ejs',
	// Utilities.
	utils: '../utils'
};

// -----------------
// Export proxy tim.
// ---
//
//
// Proxy tim is an ES2015 proxy object. More info on proxy objects:
//   - https://ponyfoo.com/articles/es6#proxies
//   - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
//   - https://stackoverflow.com/questions/27130677/access-default-getter-setter-for-javascript-object
//
module.exports = new Proxy(tim, {
	// This overrides tim's default property getter. If the property is a string OR doesn't exist, tim will try to node require it.
	get(tim, property) {
		if (typeof tim[property] === 'string') {
			tim[property] = require(tim[property] ? tim[property] : property);
		}
		return tim[property];
	}
});

function logify(options = {}, ...items) {
	if (typeof options === 'string') options = { level: options };
	options = Object.assign(
		{
			level: 'info',
			width: 60
		},
		options
	);
	items = items.join(' ');
	if (items.length > options.width) {
		items = tim.utils.wrapText(items, options);
	}
	if (options.pad) {
		items = '\n' + items + '\n';
	}
	return logger[options.level](items);
}
