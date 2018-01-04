#! /usr/bin/env node
/** ------------------------------------------------------------------------------------------------
 *  config/index.js
 *  ---------------
 *  @author  brikcss  <https://github.com/brikcss>
 *  @description  tim.config helpers for working with config files.
 ** --------------------------------------------------------------------------------------------- */

const config = {
	load: './load',
	init: './init'
};

// --------------------
// Export proxy config.
// ---
//
module.exports = new Proxy(config, {
	// This overrides config's default property getter. If the property is a string OR doesn't exist, config will try to node require it.
	get(config, property) {
		if (typeof config[property] === 'string') {
			config[property] = require(config[property] ? config[property] : property);
		}
		return config[property];
	}
});
