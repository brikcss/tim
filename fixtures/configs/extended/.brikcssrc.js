const originalConfig = require('../brikcss.config');

module.exports = Object.assign(originalConfig, {
	_brik: {
		extends: ['../json/', '../yaml']
	},
	extendedLoaded: true
});
