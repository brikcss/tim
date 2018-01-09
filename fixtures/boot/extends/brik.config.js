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
	_briks: () => {
		return {
			output: '.temp/extends'
		};
	}
};
