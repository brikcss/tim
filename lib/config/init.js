/** ------------------------------------------------------------------------------------------------
 *  init.js
 *  -------
 *  @author  brikcss  <https://github.com/brikcss>
 *  @description  Creates a default config file.
 ** --------------------------------------------------------------------------------------------- */

const tim = require('../tim');

module.exports = () => {
	return tim.fs
		.readFile(tim.path.join(__dirname, '../../.brikrc-defaults.js'), 'utf8')
		.then(result => {
			return tim.fs.writeFile(
				tim.path.join(process.cwd(), '.brikcssrc.js'),
				result
					.toString()
					.replace('module.exports = userOptions => {', 'module.exports = (brik, tim) => {')
					.replace(/userOptions.cwd \|\| /g, '')
			);
		})
		.then(result => {
			tim.log.info('Done! Created `.brikcssrc.js`.');
			return result;
		});
};
