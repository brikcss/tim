const originalConfig = require('../brikcss.config');

module.exports = Object.assign(originalConfig, {
	_tim: {
		extends: ['../json/', '../yaml']
	},
	extendedLoaded: true
});
