#! /usr/bin/env node
/** ------------------------------------------------------------------------------------------------
 *  boot/index.js
 *  -------------
 *  Boots (or reboots) a glob, directory, or file of templates, which are compiled to their destination.
 *  @author  brikcss <https://github.com/brikcss>
 ** --------------------------------------------------------------------------------------------- */

/**
 *  [[START]] Export function.
----------------------------------------------------------------------------------------------------
**/

/**
 *  Boot files from ejs templates or js modules.
 *
 *  @param   {object|glob}  options  Boot options. If not an object, will be set as options.files property and use defaults for all other properties. For all possible options and their default values, see `https://github.com/brikcss/tim/.brikrc-defaults.js`.
 *  @param   {object}  data  {} | Additional data to merge with config file data. Any data passed here gets precedence over config data.
 *  @return  {promise}  Returns: {
 *      filepaths: {in: [''], out: ['']},
 *      briks: [{startPath: '', root: '', files: [''], options: [{}]}],
 *      files: [{
 *          startPath: '',
 *          success: true,
 *          skip: false,
 *          overwrite: false,
 *          outPathExists: false,
 *          isJsExport: false,
 *          isJsonExport: false,
 *          in: '',
 *          out: '',
 *          relative: function(direction) {return ''}
 *      }],
 *      filesMap: {'<filepath>': '<brikpath>'},
 *      briksMap: {'<brikpath>': {startPath: '', root: '', files: [''], options: {}}},
 *      options: {}, // Merges defaultOptions, userOptions (from node or cli), configOptions ('_brik' property).
 *  },
 */
const tim = require('../tim');
module.exports = (options = {}, data = {}) => {
	// Get this party started.
	tim.utils.timer.start('boot');
	tim.log.warn('\nBooting up...\n');

	// If options is not an object, convert it to one.
	if (typeof options !== 'object') {
		options = { files: options };
	}

	// Resolve the config file.
	return (
		tim.config
			.load(options.config)
			// Validate required options, set defaults, and merge options & data with config file.
			.then(entryBrik => {
				entryBrik = tim.utils.merge(entryBrik, { options, data });
				return buildABrik(entryBrik, { userBrik: entryBrik });
			})
			// Parse results.
			.then(results => {
				// Normalize results and reduce to a single object.
				results = results.reduce(
					(result, brik) => {
						brik.meta.files = brik.meta.files || [];
						// Iterate through files to grab more data.
						brik.meta.files.forEach(file => {
							// Make paths relative, if option is set.
							if (brik.options.relativePaths) {
								brik.options.root = tim.path.relative(brik.options.cwd, brik.options.root);
								brik.meta.startPath = tim.path.relative(brik.options.cwd, brik.meta.startPath);
								file.in = tim.path.relative(brik.options.cwd, file.in);
								file.out = tim.path.relative(brik.options.cwd, file.out);
								file.startPath = tim.path.relative(brik.options.cwd, file.startPath);
							}
							// Add filepaths to filepaths and filesMap.
							if (file.in) {
								// Add file.in to filesMap, which maps each file.in to its brik.options.root.
								result.filesMap[file.in] = brik.options.root;
								// Add file.in to filepaths.in.
								result.filepaths.in.push(file.in);
							}
							if (file.out) {
								// Add file.in to filesMap, which maps each file.out to its brik.options.root.
								result.filesMap[file.out] = brik.options.root;
								// Add file.out to filepaths.out if it isn't already there.
								if (result.filepaths.out.indexOf(file.out) === -1) {
									result.filepaths.out.push(file.out);
								}
							}
						});
						// Return all compiled files as an array of objects.
						result.files = result.files.concat(brik.meta.files);
						// Return all compiled briks as an array of objects.
						result.briks.push(brik);
						// Return a lookup map which maps brik.options.root to the brik.
						result.briksMap[brik.options.root] = brik;
						// Return result accumulator.
						return result;
					},
					{
						filepaths: { in: [], out: [] },
						files: [],
						briks: [],
						filesMap: {},
						briksMap: {},
						options,
						data
					}
				);

				// Clean up temporary directories.
				tim.rm.sync('.briks');

				// Return results.
				return results;
			})
			.catch(error => {
				tim.rm.sync('.briks');
				return logError(error);
			})
	);
};

/* [[END]] -------------------------------------------------------------------------------------- */

/**
 *  [[START]] Helper functions.
----------------------------------------------------------------------------------------------------
**/

/**
 *  Prepares a brik for compilation.
 *
 *  @param   {object}  brik  Starting brik object.
 *  @param   {object}  cache  Global internal cache.
 *  @return  {promise}
 */
function buildABrik(brik = {}, cache = {}) {
	// Support passing string to files and extends properties.
	if (typeof brik.options.files === 'string') brik.options.files = [brik.options.files];
	if (typeof brik.options.extends === 'string') brik.options.extends = [brik.options.extends];

	// Make sure files OR extends is properly defined.
	if (
		(!tim.utils.isArray(brik.options.files) && !tim.utils.isArray(brik.options.extends)) ||
		(!brik.options.files.length && !brik.options.extends.length)
	) {
		return logError('options.files OR options.extends is required and must be a string or Array of strings.', true);
	}

	// If this is the entry brik, set up default options. Otherwise use entry brik options as defaults.
	if (!cache.entryLoaded) {
		cache.entryLoaded = true;

		// Set default options and merge with config file options and options passed directly.
		brik.options = tim.utils.merge(require('../../.brikrc-defaults')(brik.options)._brik, brik.options);

		// Ensure cwd and output are absolute.
		if (!tim.path.isAbsolute(brik.options.cwd)) {
			brik.options.cwd = tim.path.resolve(brik.options.cwd);
		}
		if (!tim.path.isAbsolute(brik.options.output)) {
			brik.options.output = tim.path.resolve(brik.options.cwd, brik.options.output);
		}

		// Override globby options that need to be static.
		brik.options.globby.cwd = brik.options.cwd;
		brik.options.globby.ignore = brik.options.ignore;

		// Cache this as the entry brik.
		cache.entryBrik = brik;
	} else {
		// @todo: To set up EXTEND feature: Merge entry brik and child brik options here.
		// OLD CODE:
		// // Cache brik-specific options.
		// const brikDefaults = brikDefaultConfig.data._brik || {};
		// let brikConfig = {};
		// brik.name = brikDefaults.name || options.name || tim.path.relative(options.cwd, brik.options.root);
		// if (typeof data._briks === 'object' && typeof data._briks[brik.name] === 'object')
		// 	brikConfig = data._briks[brik.name];
		// else if (typeof data._briks === 'function') brikConfig = data._briks(brik, data, tim);
		// else if (typeof data._briks === 'object' && typeof data._briks[brik.name] === 'function')
		// 	brikConfig = data._briks[brik.name](brik, data, tim);
		// // Merge brik with options.
		// brik = tim.utils.merge(options, brik, brikDefaults, brikConfig);
	}

	// Compile each brik of files.
	let bootPromises = [];
	brik.options.files.forEach(brikFilepaths => {
		let childBrik = {
			files: brikFilepaths
		};

		// Make all brik file paths absolute.
		if (tim.utils.isArray(childBrik.files)) {
			childBrik.root = brik.options.root || brik.options.on.getBrikRoot(childBrik.files[0], { brik, tim });
			childBrik.files.forEach((filepath, i) => {
				childBrik.files[i] = tim.utils.pathAbsolute(filepath, brik.options.cwd);
			});
		} else {
			// Process any git repos.
			if (childBrik.files.indexOf('gh:') === 0) {
				childBrik.root = childBrik.files.slice(3);
				childBrik.files = childBrik.root;
				childBrik.url = `https://github.com/${childBrik.files}.git`;
			} else if (childBrik.files.indexOf('gh@') === 0) {
				childBrik.root = childBrik.files.slice(3);
				childBrik.files = childBrik.root;
				childBrik.url = `git@github.com:${childBrik.files}.git`;
			} else if (childBrik.files.indexOf('git@') === 0 || childBrik.files.indexOf('https://') === 0) {
				childBrik.url = childBrik.files;
				childBrik.root = childBrik.files
					.replace('git@', '')
					.replace('https://', '')
					.replace('github.com', '')
					.slice(1);
				childBrik.files = childBrik.root;
			}

			// If there's a repo url, clone it (including submodules, if any).
			if (childBrik.url) {
				// Set childBrik.root to the (eventually) cloned git repo directory.
				childBrik.root = tim.path.join('.briks', childBrik.root);
				childBrik.files = tim.path.join('.briks', childBrik.files);
				// Clone the repo.
				tim.shell.exec(`git clone ${childBrik.url} ${childBrik.root} --recursive`);
			}

			// Get brik's root path.
			childBrik.root = tim.utils.pathAbsolute(
				childBrik.root || brik.options.root || brik.options.on.getBrikRoot(childBrik.files, { brik, tim }),
				brik.options.cwd
			);
			// Process child brik files as a string.
			childBrik.files = tim.utils.pathAbsolute(childBrik.files, brik.options.cwd);
		}

		// Compile each brik.
		childBrik = tim.utils.merge({}, brik, { options: childBrik });
		bootPromises.push(compileABrik(childBrik, cache));
	});

	return Promise.all(bootPromises);
}

/**
 *  Compile a brik.
 *
 *  @param   {object}  brik  Brik to compile.
 *  @param   {object}  cache  Global internal cache.
 *  @return  {promise}
 */
function compileABrik(brik = {}, cache = {}) {
	let compilePromise;
	// Return files to compile.
	if (!brik.options.disableGlobs) {
		compilePromise = tim.globby(brik.options.files, brik.options.globby);
	} else {
		compilePromise = Promise.resolve(brik.options.files);
	}

	return (
		// Get array filepaths to boot up.
		compilePromise
			// Compile each filepath, either as an export (brik.jsExports), export extend (brik.jsonExports), or EJS template.
			.then(result => {
				result = result instanceof Array ? result : [result];
				tim.log.debug('filepaths:', '\n    - ' + result.join('\n    - '), '\n');
				let compilePromises = [];

				// Compile each filepath.
				result.forEach(filepath => compilePromises.push(compileAFile(filepath, brik, cache)));

				// Continue after all files are compiled.
				return Promise.all(compilePromises).then(files => {
					brik.meta.files = files;
					return brik;
				});
			})
			// Notify user and return results.
			.then(brik => {
				// Notify user.
				tim.utils.timer.stop('boot');
				const compiledCount = brik.meta.files.filter(file => file.success && !file.skip).length;
				// Notify user that compiling is done.
				tim.logify(
					{ level: 'warn', pad: true },
					`[ok] Done! Compiled ${compiledCount} file${
						compiledCount === 1 ? '' : 's'
					} (${tim.utils.timer.duration('boot')}).`
				);
				if (brik.meta.files.some(file => file.skip)) {
					// Notify user if any files are skipped.
					tim.logify(
						{ level: 'warn', pad: true },
						' [i] At least one file was skipped. Set `overwrite = true`, or pass a glob of files, to have tim overwrite existing files. IMPORTANT: Use `overwrite` with caution.'
					);
				}
				// Return result object.
				tim.log.debug(brik.meta.files);
				tim.log.trace(brik);
				tim.log.debug();
				return brik;
			})
			.catch(logError)
	);
}

/**
 *  Compile filepath as JS export, JSON export, or EJS template.
 *
 *  @param   {string}  filepath  Path to template file.
 *  @param   {object}  [brik]  Brik options, passed down.
 *  @param  {object}  [data]  Data to compile template with.
 *  @return  {promise}  Returns file object.
 */
function compileAFile(filepath, brik = {}, cache = {}) {
	return new Promise((resolve, reject) => {
		// -------------------
		// Create file object.
		// This will contain file-specific settings and will be returned to user.
		//
		let file = {
			success: false,
			skip: false,
			overwrite: false,
			outPathExists: false,
			isJsExport: false,
			isJsonExport: false,
			in: '',
			out: '',
			relative: direction => {
				return tim.path.relative(direction === 'out' ? brik.options.output : brik.options.cwd, file[direction]);
			}
		};
		// Set absolute filepaths.
		file.startPath = filepath;
		file.in = tim.path.isAbsolute(filepath) ? filepath : tim.path.resolve(brik.options.cwd, filepath);
		file.out = tim.path.resolve(brik.options.output, tim.path.relative(brik.options.root, file.in));

		// Check if output file already exists.
		file.isJsExport =
			brik.options.jsExports &&
			brik.options.jsExports.some(glob => tim.minimatch(file.in, glob, brik.options.minimatch));
		file.isJsonExport =
			brik.options.jsonExports &&
			brik.options.jsonExports.some(glob => tim.minimatch(filepath, glob, brik.options.minimatch));

		// Rename file.out.
		if (file.isJsExport && tim.path.extname(file.out) === '.xjs') {
			// Remove .xjs extension (user should already have a secondary extension which will replace it).
			file.out = tim.path.replaceExt(file.out, '');
		} else if (file.isJsonExport && tim.path.extname(file.out) === '.xjson') {
			// Replace .xjson extension with .json.
			file.out = tim.path.replaceExt(file.out, '.json');
		}
		// Run rename callback on file.out.
		file.out = brik.options.on.rename(file, { brik, tim });

		// -------------------------------------
		// Determine whether to compile or skip.
		//
		file.outPathExists = Boolean(tim.fs.pathExistsSync(file.out));
		file.overwrite = brik.options.overwrite || brik.options.on.overwriteFile(file, { brik, tim });

		// Run compileOrSkip callback to determine whether to skip file.
		if (
			(!file.isJsonExport && file.outPathExists && !file.overwrite) ||
			!brik.options.on.compileOrSkip(file, { brik, tim })
		) {
			return resolve(skipFile(file));
		}

		// -------------
		// Compile file.
		// File is compiled as either JS export, JSON export, or EJS template.
		//
		if (file.isJsExport) {
			// If filepath matches brik.options.jsExports, compile as a JS export.
			file.content = requireExportFile(file, brik);
		} else if (file.isJsonExport) {
			// If filepath matches brik.jsonExports, compile as a node export and merge with any existing file in output directory.
			file.content = requireExportFile(file, brik, false);

			// Merge with output file, if one exists.
			if (file.outPathExists) {
				file.existing = tim.fs.readJsonSync(file.out, {
					throws: false
				});
				// Run json merge callback.
				file.content = brik.options.on.jsonMerge(file, {
					brik,
					tim
				});
				// Run json sort callback.
				file.content = brik.options.on.jsonSort(file, {
					brik,
					tim
				});
				// Delete existing file, we only needed it for merging and sorting jsons.
				delete file.existing;
			}

			// Merge with a base object, if configured in brik.jsons.
			if (brik.options.jsons && Object.keys(brik.options.jsons).indexOf(file.relative('out')) > -1) {
				file.base = brik.options.jsons[file.relative('out')];
				// If the base is a string, read the file path.
				if (typeof file.base === 'string') {
					file.basePath = file.base;
					file.base = tim.fs.readJsonSync(tim.path.join(brik.options.cwd, file.base), {
						throws: false
					});
				}
				// If base is not an object, throw an error.
				if (file.base === null || typeof file.base !== 'object') {
					reject(
						new Error('Object values in brik.options.jsons must be an existing file path or an object.')
					);
				}
				// Otherwise, it should be an object.
				file.content = file.overwrite
					? Object.assign({}, file.content, file.base)
					: tim.utils.merge(file.content, file.base);
			}

			// Merge and stringify content.
			file.content = JSON.stringify(file.content, null, '\t');
		} else {
			tim.log.debug(`Compiling as EJS template:\n    ${file.relative('in')}\n`);
			// Compile the rest EJS templates.
			file.content = tim.ejs.render(
				tim.fs.readFileSync(file.in, 'utf8'),
				Object.assign(
					tim.utils.merge({}, brik.data, {
						options: brik.options || {},
						meta: brik.meta || {},
						file: file || {}
					}),
					{ tim: tim }
				),
				brik.options.ejs || {}
			);
		}

		// --------------------------
		// Save file and notify user.
		//
		tim.log.trace('content:', file.content);

		// Output files to <brik.options.output>/<relative path to file from template's root dir>.
		tim.fs.outputFileSync(file.out, file.content, {
			flag: file.overwrite || file.isJsonExport ? 'w' : 'wx'
		});

		// Log compile result.
		tim.log.info(
			`Compiled ${file.inRelative ? '`' + file.inRelative + '` to ' : ''}\`${tim.path.relative(
				brik.options.cwd,
				file.out
			)}\`.`
		);

		// -------------------
		// Return file object.
		//
		file.success = true;
		delete file.content;
		return resolve(file);
	});
}

/**
 *  Require a file to be compiled as a JS/JSON export.
 *
 *  @param   {object}  file  File object.
 *  @param   {object}  brik  Brik object.
 *  @param   {boolean}  stringify  Whether to stringify the result.
 *  @return  {any}  String, if stringified. Otherwise whatever the file returns.
 */
function requireExportFile(file, brik = {}, stringify = true) {
	let content;

	tim.log.debug(`Compiling as ${file.isJsonExport ? 'JSON' : 'JS'} export:\n    ${file.relative('in')}\n`);

	// Delete require cache for this file.
	delete require.cache[file.in];

	// Require the file.
	content = require(file.in);

	// If the export is a function, call it.
	if (typeof content === 'function') {
		content = content(brik.data, { options: brik.options, meta: brik.meta, file, tim });
	}

	// Make sure the content is a string.
	if (stringify && typeof content !== 'string') {
		content = JSON.stringify(content, null, '\t');
	}

	// Return the content.
	return content;
}

/**
 *  Skip compiling a file.
 *
 *  @param   {object}  file  File object.
 *  @return  {object}  file.
 */
function skipFile(file) {
	tim.log.info(`Skipped \`${file.relative('in')}\`. File already exists.`);
	file.skip = true;
	file.success = true;
	return file;
}

/**
 *  Log error that was thrown.
 *
 *  @param   {object}  error  Error that has instanceof error.
 *  @return  {object}  error
 */
function logError(error, throwError) {
	tim.log.error(error);
	tim.utils.timer.clear('boot');
	if (throwError) throw new Error(error);
	return error;
}

/* [[END]] -------------------------------------------------------------------------------------- */
