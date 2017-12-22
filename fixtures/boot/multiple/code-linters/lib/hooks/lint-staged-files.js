/** ------------------------------------------------------------------------------------------------
 *  lint-staged-files.js
 *  --------------------
 *  @author  brikcss <https://github.com/brikcss>
 *  @description  This script runs code linters and formatters **only on staged files**. This means
 *    we don't have to run them during dev build, speeding it up.
 *  @param  {list}  [ignore]  Comma-separated list of file types to ignore (js, json, or css).
 *  @param  {list}  [js]  JS file extensions to lint (.js).
 *  @param  {list}  [json]  JSON file extensions to lint (.json).
 *  @param  {list}  [css]  CSS file extensions to lint (.css,.scss).
 ** --------------------------------------------------------------------------------------------- */
/* eslint-env node, es6 */

// -------------------
// Set up environment.
//
const tim = require('../tim');
const promises = [];
const options = tim.minimist(process.argv.slice(1));

// --------------------------------------------
// Get filepaths for staged JS/JSON/SASS files.
//
let files = {
	js: [],
	json: [],
	css: [],
	staged: [],
	partiallyUnstaged: [],
	unstagedDiffs: 'partial-unstaged-diffs.diff'
};
options.ignore = options.ignore ? options.ignore.split(',') : [];
const fileExts = {};
if (options.ignore.indexOf('js') === -1) fileExts.js = options.js ? options.js.split(',') : ['.js'];
if (options.ignore.indexOf('json') === -1) fileExts.json = options.json ? options.json.split(',') : ['.json'];
if (options.ignore.indexOf('css') === -1) fileExts.css = options.css ? options.css.split(',') : ['.css', '.scss'];
const unstagedCharacters = [' ', '?'];
// Loop through all modified styles and cache to various file types we're interested in.
tim.shell
	.exec('git status --porcelain', { silent: true })
	.stdout.trim()
	.split('\n')
	.forEach(function(file) {
		const filepath = file.slice(3);
		// Cache all staged filepaths.
		if (unstagedCharacters.indexOf(file[0]) === -1) {
			files.staged.push(filepath);
			// Cache staged files that have the extensions we're in.
			Object.keys(fileExts).some(function(key) {
				if (fileExts[key].indexOf(tim.path.extname(filepath)) > -1) {
					files[key].push(filepath);
					return true;
				}
			});
		}
		// Cache partially unstaged files.
		if (unstagedCharacters.indexOf(file[0]) === -1 && unstagedCharacters.indexOf(file[1]) === -1) {
			files.partiallyUnstaged.push(filepath);
		}
	});
tim.log.debug(files);

// -----------------------------------------
// Exit if no JS/JSON/SASS files are staged.
//
if (!files.js.length && !files.css.length && !files.json.length) {
	tim.log.warn('\n [ok] No staged JS/SASS files to lint.\n');
	process.exit(0);
}

// ----------------------
// Get the party started.
//
tim.log.info('\n [i] Running precommit linters on staged files...\n');

// -------------------------------
// Stash partially unstaged files.
//   NOTE: Partially unstaged files have both staged and unstaged portions.
//   The reason we need to stash these is because the linters may modify and add files. If there are
//   partially unstaged files, the unstaged portions would get added, undesirably so.
//
// Clean up any old partial diff file.
tim.fs.removeSync(files.unstagedDiffs);
// Stash partially unstaged files.
if (files.partiallyUnstaged.length) {
	tim.shell.exec(
		`git diff --ignore-submodules --binary  --no-color --no-ext-diff ${files.partiallyUnstaged.join(' ')} > ${
			files.unstagedDiffs
		} && git checkout -- ${files.partiallyUnstaged.join(' ')}`
	);
}

// ----------------------------
// Process each group of files.
//

// Process SASS files: prettier > stylelint > git add.
if (files.css.length) {
	tim.log.info(`     CSS: ${files.css.join(', ')}`);
	promises.push(
		createPromise(
			`node ./node_modules/prettier/bin/prettier.js ${files.css.join(
				' '
			)} --write --color=always && node ./node_modules/stylelint/bin/stylelint.js ${files.css.join(' ')} --color always`
		)
	);
} else {
	tim.log.info('     CSS: None staged');
}

// Process JS files: prettier > eslint > git add.
if (files.js.length) {
	tim.log.info(`     JS: ${files.js.join(', ')}`);
	promises.push(
		createPromise(
			`node ./node_modules/prettier/bin/prettier.js ${files.js.join(
				' '
			)} --write --color=always && node ./node_modules/eslint/bin/eslint.js ${files.js.join(' ')} --color always --fix`
		)
	);
} else {
	tim.log.info('     JS: None staged');
}

// Process JSON files: prettier > git add.
if (files.json.length) {
	tim.log.info(`     JSON: ${files.json.join(', ')}`);
	promises.push(
		createPromise(`node ./node_modules/prettier/bin/prettier.js ${files.json.join(' ')} --write --color=always`)
	);
} else {
	tim.log.info('     JSON: None staged');
}

// ----------------------------------------------------
// Process results after all file groups are processed.
//
try {
	return Promise.all(promises)
		.then(results => {
			let errors = [];
			// Check for errors.
			results.forEach(function(result) {
				if (!result.success) {
					errors.push(result.error);
				}
			});
			// Throw any errors now.
			if (errors.length) {
				throwError(errors);
			} else {
				// If there are no errors, add newly formatted/linted files to the commit, then reset stage.
				tim.shell.exec(`git add ${files.staged.join(' ')}`);
				resetStage();
			}
			// Notify user.
			let resultMsg = '\n[ok] Done! All staged files formatted and linted.';
			if (files.partiallyUnstaged.length) {
				resultMsg += `\n\n[!!] IMPORTANT: You had partially unstaged files (${files.partiallyUnstaged.join(
					', '
				)}). In order to complete the precommit linter tasks we had to reset the unstaged portions of these files and later try to reapply them. Any conflicts while reapplying are rejected, in which case git creates a \`*.rej\` file with the rejected portions. Please review any \`*.rej\` files to reapply any rejected hunks manually. Review above log for more details.`;
			}
			resultMsg += '\n\nCommitting changes...\n';
			tim.log.warn(resultMsg);
			return;
		})
		.catch(errors => throwError(errors, 'Uh oh... there was a problem...'));
} catch (error) {
	tim.log.error('\n[!!] Uh oh... there was a problem...\n', error);
	process.exit(1);
}

// ----------
// Functions.
//

/**
 *  Create a promise to run an asyncronous command via tim.shell.exec().
 *
 *  @param   {string}  stringCommand  Command to run via tim.shell.exec().
 *  @return  {promise}  Promise to return command result.
 */
function createPromise(stringCommand) {
	return new Promise(function(resolve) {
		tim.shell.exec(stringCommand, { async: true, silent: true }, function(code, stdout, stderr) {
			if (code > 0) {
				let error = {
					code,
					message: stderr || stdout
				};
				if (error.message) {
					error.message = '     ' + error.message.replace(/\n/g, '\n     ');
				}
				resolve({
					success: false,
					error
				});
			} else if (stdout.trim().length) {
				tim.log.warn('     ' + stdout.trim().replace(/\n/g, '\n     '));
			}
			resolve({ success: true });
		});
	});
}

/**
 *  Throw an error and exit without committing.
 *
 *  @param   {array|object|string}  errors  Error to throw.
 *  @param   {string}  introMsg  Message to show at beginning.
 *  @return  {boolean}  Always returns false.
 */
function throwError(
	errors,
	introMsg = 'Uh oh... there are errors you need to fix before you can commit these changes...'
) {
	// Log intro message.
	tim.log.error(`\n[!!] ${introMsg}\n`);
	// Log each error.
	if (errors instanceof Array) {
		errors.forEach(function(error) {
			// if (error.code) {
			// 	tim.log.error('     ERROR CODE:', error.code);
			// }
			if (error.message) {
				tim.log.error(error.message);
			}
		});
	} else {
		tim.log.error(errors);
	}
	// Reset the git state.
	resetStage();
	// Exit with error code 1.
	process.exit(1);
	return false;
}

/**
 *  Reset git's stage and reapply files that were previously partially unstaged.
 */
function resetStage() {
	const filesToReset = files.staged.join(' ');
	// Reset the stage.
	tim.shell.exec(`git checkout -- ${filesToReset}`);
	// If the partial unstaged diff file exists, apply it.
	if (tim.fs.pathExistsSync(files.unstagedDiffs)) {
		tim.log.info('\n\n [i] Attempting to reapply partially unstaged changes...\n');
		const applyChild = tim.shell.exec(`git apply --reject --whitespace=nowarn ${files.unstagedDiffs}`, {
			silent: true
		});
		tim.log.info('     ' + (applyChild.stderr || applyChild.stdout).trim().replace(/\n/g, '\n     '));
	}
}
