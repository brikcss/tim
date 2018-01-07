/** ------------------------------------------------------------------------------------------------
 *  brikcss.config.js
 *  -----------------
 *  Simple config file for brikcss.
 ** --------------------------------------------------------------------------------------------- */

module.exports = {
	_brik: {
		extends: ['./commitlint', './code-linters'],
		output: '.temp/extends1'
	},
	_briks: {
		'@brikcss-test/code-linters': {
			output: '.temp/extends'
		},
		'@brikcss-test/commitlint': (data, brik, tim) => {
			return {
				output: '.temp/extends'
			};
		}
	}
};
