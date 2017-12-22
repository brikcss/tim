/** ------------------------------------------------------------------------------------------------
 *  get-root-directory.js
 *  ---------------------
 *  Returns root directory for a filepath, which may be a glob or string path.
 *  @author  brikcss <https://github.com/brikcss>
 ** --------------------------------------------------------------------------------------------- */

const tim = require('../tim');

module.exports = getFilepathDirectory;

function getFilepathDirectory(filepath) {
	const fileExists = tim.fs.existsSync(filepath);
	if (fileExists && tim.fs.lstatSync(filepath).isDirectory()) {
		// If file exists and is a directory, return the filepath.
		return filepath;
	} else {
		if (filepath.indexOf('/') > -1) {
			// Go one directory up and check that directory.
			filepath = filepath.split('/');
			filepath.pop();
			return getFilepathDirectory(filepath.join('/'));
		} else {
			// If there are no more '/' in the path, return undefined.
			return undefined;
		}
	}
}
