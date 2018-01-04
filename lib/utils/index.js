#! /usr/bin/env node
/** ------------------------------------------------------------------------------------------------
 *  utils/index.js
 *  ---------------
 *  @author  brikcss  <https://github.com/brikcss>
 *  @description  tim.utils utility helpers.
 ** --------------------------------------------------------------------------------------------- */

const tim = require('../tim');
const utils = {
	merge: 'deepmerge',
	timer: {
		_: {},
		start: id => {
			tim.utils.timer._[id] = tim.utils.timer._[id] || {};
			tim.utils.timer._[id].start = Date.now();
		},
		stop: id => {
			tim.utils.timer._[id].stop = Date.now();
			return tim.utils.timer.duration(id);
		},
		clear: id => delete tim.utils.timer._[id],
		duration(id) {
			const duration = tim.utils.timer._[id].stop - tim.utils.timer._[id].start;
			return duration > 999 ? duration / 1000 + 's' : duration + 'ms';
		}
	},
	deferred() {
		let deferred = this;
		deferred.promise = new Promise((resolve, reject) => {
			deferred.resolve = value => {
				resolve(value);
				return deferred.promise;
			};
			deferred.reject = error => {
				reject(error);
				return deferred.promise;
			};
		});
		return deferred;
	},
	wrapText,
	getRoot,
	sortObject
};

// --------------------
// Export proxy utils.
// ---
//
module.exports = new Proxy(utils, {
	// This overrides utils's default property getter. If the property is a string OR doesn't exist, utils will try to node require it.
	get(utils, property) {
		if (typeof utils[property] === 'string') {
			utils[property] = require(utils[property] ? utils[property] : property);
		}
		return utils[property];
	}
});

function wrapText(text, options = {}) {
	options = Object.assign(
		{
			width: 60,
			indent: '',
			newline: '\n',
			trim: false, // Trims end of line since .trim() would also trim indentation.
			cut: false // Set true to break any two letters when word is long.
		},
		options
	);
	const wrap = require('word-wrap');
	text = wrap(text, options);
	if (options.log) {
		options.log = typeof options.log === 'string' ? options.log : 'info';
		tim.log[options.log](text);
	}
	return text;
}

function getRoot(filepath) {
	return require('../utils/get-root-directory.js')(filepath);
}

function sortObject(source, sorter) {
	const sortedObject = {};
	sorter = sorter || Object.keys(source).sort();
	sorter.forEach(key => {
		if (!sortedObject[key]) {
			sortedObject[key] = source[key];
		}
	});
	return sortedObject;
}
