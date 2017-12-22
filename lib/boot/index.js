#! /usr/bin/env node
/** ------------------------------------------------------------------------------------------------
 *  boot/index.js
 *  -------------
 *  Boots (or reboots) a glob, directory, or file of templates, which are compiled to their destination.
 *  @author  brikcss <https://github.com/brikcss>
 *  @todo  Find a way to test the watch function.
 ** --------------------------------------------------------------------------------------------- */

/**
 *  [[START]] Export function.
----------------------------------------------------------------------------------------------------
**/

/**
 *  Boot files from ejs templates or js modules.
 *
 *  @param   {object|glob}  options  Boot options. If not an object, will be set as options.files property and use defaults for all other properties. For all possible options and their default values, see `https://github.com/brikcss/tim/.brikcssrc-defaults.js`.
 *  @param   {object}  data  {} | Additional data to merge with config file data. Any data passed here gets precedence over config data.
 *  @return  {promise}  Returns: {all, map, filepaths, options, data}
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

	// Make sure files is defined and is an array.
	if (
		typeof options.files === 'undefined' ||
		(typeof options.files !== 'string' && !(options.files instanceof Array))
	) {
		return logError(
			'options.files is required and must be a string or Array of strings, and/or globs (including Arrays).',
			true
		);
	} else if (typeof options.files === 'string') {
		options.files = [options.files];
	}

	// Resolve the config file.
	return (
		tim.config
			.load(options.config)
			// Validate required options, set defaults, and merge options & data with config file.
			.then(config => {
				// Merge user options with defaults.
				options = mergeOptions(options, config);

				// Merge data with config file data.
				data = tim.utils.merge(config.data, data);

				// Compile each brik of files.
				let bootPromises = [];
				options.files.forEach(brikFiles => {
					let repoUrl;

					// If brikFiles is a git repo, process it.
					if (brikFiles.indexOf('gh:') === 0) {
						brikFiles = brikFiles.slice(3);
						repoUrl = `https://github.com/${brikFiles}.git`;
					} else if (brikFiles.indexOf('gh@') === 0) {
						brikFiles = brikFiles.slice(3);
						repoUrl = `git@github.com:${brikFiles}.git`;
					} else if (brikFiles.indexOf('git@') === 0 || brikFiles.indexOf('https://') === 0) {
						repoUrl = brikFiles;
						brikFiles = brikFiles
							.replace('git@', '')
							.replace('https://', '')
							.replace('github.com', '')
							.slice(1);
					}

					// If there's a repo url, clone it (including submodules, if any).
					if (repoUrl) {
						// Set brikFiles to the (eventually) cloned git repo directory.
						brikFiles = tim.path.join('.briks', brikFiles);
						// Set the root to the local git repo. Cache the original root.
						options.userRoot = options.root;
						options.root = brikFiles;
						// Clone the repo.
						tim.shell.exec(`git clone ${repoUrl} ${brikFiles} --recursive`);
					} else {
						// Restore original root, in case it was reset by a git repo.
						options.root = options.userRoot;
					}

					// Boot each brik.
					bootPromises.push(bootBrikFiles(brikFiles, options, data));
				});

				return Promise.all(bootPromises);
			})
			.then(results => {
				// Normalize results and reduce to a single object.
				results = results.reduce(
					(result, brik) => {
						// Iterate through files to grab more data.
						brik.files.forEach(file => {
							// Make paths relative, if option is set.
							if (options.relativePaths) {
								brik.root = tim.path.relative(options.cwd, brik.root);
								brik.source = tim.path.relative(options.cwd, brik.source);
								file.in = tim.path.relative(options.cwd, file.in);
								file.out = tim.path.relative(options.cwd, file.out);
								file.source = tim.path.relative(options.cwd, file.source);
							}
							// Add filepaths to filepaths and filesMap.
							if (file.in) {
								// Add file.in to filesMap, which maps each file.in to its brik.root.
								result.filesMap[file.in] = brik.root;
								// Add file.in to filepaths.in.
								result.filepaths.in.push(file.in);
							}
							if (file.out) {
								// Add file.in to filesMap, which maps each file.out to its brik.root.
								result.filesMap[file.out] = brik.root;
								// Add file.out to filepaths.out if it isn't already there.
								if (result.filepaths.out.indexOf(file.out) === -1) {
									result.filepaths.out.push(file.out);
								}
							}
						});
						// Return all compiled files as an array of objects.
						result.files = result.files.concat(brik.files);
						// Return all compiled briks as an array of objects.
						result.briks.push(brik);
						// Return a lookup map which maps brik.root to the brik.
						result.briksMap[brik.root] = brik;
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
				// If watch option is set, watch the files without running boot first. Otherwise call the main boot method.
				if (options.watch) {
					const filesToWatch = results.filepaths.in;
					// Disable watch so the watch function doesn't get called again.
					options.watch = false;
					// Add the config entry file to the watcher.
					if (options.config.entry) {
						filesToWatch.push(options.config.entry);
					}
					return watchFiles(filesToWatch, results, {
						ignore: results.options.userIgnored,
						data
					});
				}

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
 *  Main boot function. This compiles a "brik", which is a file, folder, or glob of files.
 *
 *  @param   {string|array}  brikFiles  File, directory, or glob of files to compile.
 *  @param   {object}  [options]  Options passed from export function.
 *  @param   {object}  [data]  Data passed from export function.
 *  @return  {promise}  Promise to return array of file objects.
 */
function bootBrikFiles(brikFiles, options = {}, data = {}) {
	// Create brik object, which is what will be returned.
	let brik = {
		root: options.root || options.on.getBrikRoot(brikFiles, { options, data, tim }),
		source: brikFiles,
		files: [],
		options: options
	};

	// Make root path relative to cwd.
	if (!tim.path.isAbsolute(brik.root)) brik.root = tim.path.resolve(options.cwd, brik.root);

	return (
		// Load brik config file, if exists.
		tim.config
			.load({
				startPath: brik.root,
				name: 'brik',
				stopDir: brik.root,
				extend: false,
				transform(result, filepath) {
					return new Promise(resolve => {
						if (!result) {
							return resolve({ config: {}, filepath: undefined });
						}
						if (typeof result.config === 'function') {
							return resolve({
								config: result.config(brik, data, tim),
								filepath
							});
						}
						return resolve({ config: result.config, filepath });
					});
				}
			})
			// Get array filepaths to boot up.
			.then(config => {
				// Merge brik.options with options.
				brik.options = tim.utils.merge.all([
					brik.options,
					{ files: brikFiles, root: brik.root },
					config.data.name && data._briks && data._briks[config.data.name]
						? tim.utils.merge(config.data, data._briks[config.data.name])
						: config.data
				]);
				// Return files to compile.
				if (brik.options.disableGlobs) {
					return brik.options.files;
				}
				return tim.globby(brik.options.files, options.globby);
			})
			// Compile each filepath, either as an export (brik.options.jsExports), export extend (brik.options.jsonExports), or EJS template.
			.then(result => {
				result = result instanceof Array ? result : [result];
				tim.log.debug('filepaths:', '\n    - ' + result.join('\n    - '), '\n');
				let compilePromises = [];

				// Compile each filepath.
				result.forEach(filepath => compilePromises.push(compileFile(filepath, brik.options, data)));

				// Continue after all files are compiled.
				return Promise.all(compilePromises).then(files => {
					brik.files = files;
					return brik;
				});
			})
			// Notify user and return results.
			.then(brik => {
				// Notify user.
				tim.utils.timer.stop('boot');
				const compiledCount = brik.files.filter(file => file.success && !file.skip).length;
				// Notify user that compiling is done.
				tim.logify(
					{ level: 'warn', pad: true },
					`[ok] Done! Compiled ${compiledCount} file${
						compiledCount === 1 ? '' : 's'
					} (${tim.utils.timer.duration('boot')}).`
				);
				if (brik.files.some(file => file.skip)) {
					// Notify user if any files are skipped.
					tim.logify(
						{ level: 'warn', pad: true },
						' [i] At least one file was skipped. Set `overwrite = true`, or pass a glob of files, to have tim overwrite existing files. IMPORTANT: Use `overwrite` with caution.'
					);
				}
				// Return result object.
				tim.log.debug(brik.files);
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
 *  @param   {object}  [options]  Options passed down.
 *  @param  {object}  [data]  Data to compile template with.
 *  @return  {promise}  Returns file object.
 */
function compileFile(filepath, options = {}, data = {}) {
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
				return tim.path.relative(direction === 'out' ? options.output : options.cwd, file[direction]);
			}
		};
		// Set absolute filepaths.
		file.source = filepath;
		file.in = tim.path.isAbsolute(filepath) ? filepath : tim.path.resolve(options.cwd, filepath);
		file.out = tim.path.resolve(options.output, tim.path.relative(options.root, file.in));

		// Check if output file already exists.
		file.isJsExport =
			options.jsExports && options.jsExports.some(glob => tim.minimatch(file.in, glob, options.minimatch));
		file.isJsonExport =
			options.jsonExports && options.jsonExports.some(glob => tim.minimatch(filepath, glob, options.minimatch));

		// Rename file.out.
		if (file.isJsExport && tim.path.extname(file.out) === '.xjs') {
			// Remove .xjs extension (user should already have a secondary extension which will replace it).
			file.out = tim.path.replaceExt(file.out, '');
		} else if (file.isJsonExport && tim.path.extname(file.out) === '.xjson') {
			// Replace .xjson extension with .json.
			file.out = tim.path.replaceExt(file.out, '.json');
		}
		// Run options.rename callback on file.out.
		file.out = options.on.rename(file, { options, data, tim });

		// -------------------------------------
		// Determine whether to compile or skip.
		//
		file.outPathExists = Boolean(tim.fs.pathExistsSync(file.out));
		file.overwrite = options.overwrite || options.on.overwriteFile(file, { options, data, tim });
		// file.overwrite = (() => {
		// 	if (typeof options.overwrite === 'boolean') return options.overwrite;
		// 	if (typeof options.overwrite === 'function') {
		// 		return options.overwrite(file, options);
		// 	}
		// })();

		// Run compileOrSkip callback to determine whether to skip file.
		if (
			(!file.isJsonExport && file.outPathExists && !file.overwrite) ||
			!options.on.compileOrSkip(file, { options, data, tim })
		) {
			return resolve(skipFile(file));
		}

		// -------------
		// Compile file.
		// File is compiled as either JS export, JSON export, or EJS template.
		//
		if (file.isJsExport) {
			// If filepath matches options.jsExports, compile as a JS export.
			file.content = requireExportFile(file, { data, options });
		} else if (file.isJsonExport) {
			// If filepath matches options.jsonExports, compile as a node export and merge with any existing file in output directory.
			file.content = requireExportFile(file, {
				data,
				options,
				stringify: false
			});

			// Merge with output file, if one exists.
			if (file.outPathExists) {
				file.existing = tim.fs.readJsonSync(file.out, {
					throws: false
				});
				// Run json merge callback.
				file.content = options.on.jsonMerge(file, {
					options,
					data,
					tim
				});
				// Run json sort callback.
				file.content = options.on.jsonSort(file, {
					options,
					data,
					tim
				});
				// Delete existing file, we only needed it for merging and sorting jsons.
				delete file.existing;
			}

			// Merge with a base object, if configured in options.jsons.
			if (options.jsons && Object.keys(options.jsons).indexOf(file.relative('out')) > -1) {
				file.base = options.jsons[file.relative('out')];
				// If the base is a string, read the file path.
				if (typeof file.base === 'string') {
					file.basePath = file.base;
					file.base = tim.fs.readJsonSync(tim.path.join(options.cwd, file.base), {
						throws: false
					});
				}
				// If base is not an object, throw an error.
				if (file.base === null || typeof file.base !== 'object') {
					reject(new Error('Object values in options.jsons must be an existing file path or an object.'));
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
				Object.assign({}, data, { _brik: options }),
				options.ejs || {}
			);
		}

		// --------------------------
		// Save file and notify user.
		//
		tim.log.trace('content:', file.content);

		// Output files to <options.output>/<relative path to file from template's root dir>.
		tim.fs.outputFileSync(file.out, file.content, {
			flag: file.overwrite || file.isJsonExport ? 'w' : 'wx'
		});

		// Log compile result.
		tim.log.info(
			`Compiled ${file.inRelative ? '`' + file.inRelative + '` to ' : ''}\`${tim.path.relative(
				options.cwd,
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
 *  Watch files and reboot when a file changes.
 *
 *  @param   {array}  filepaths  Filepaths (not globs) to watch.
 *  @param   {object}  cache  Results cache from original compile job.
 *  @param   {object}  data  Data passed from boot method.
 *  @param   {object}  ignore  Files the watcher should ignore / not watch.
 */
function watchFiles(filepaths = [], cache = {}, { ignore = [], data = {} }) {
	// Ensure filepaths is an array.
	if (typeof filepaths === 'string') filepaths = [filepaths];

	// Create the watcher.
	const watcher = tim.chokidar.watch(filepaths, {
		disableGlobbing: true,
		ignored: ignore
	});

	// Subscribe to watcher events.
	watcher
		.on('error', error => {
			throw new Error(error);
		})
		.on('change', filepath => {
			const brikOptions = cache.briksMap[cache.filesMap[filepath]];
			if (brikOptions.config.extends && brikOptions.config.extends.indexOf(filepath) > -1) {
				tim.log.info(' [i] Config changed. Rebooting...', filepath);
				tim.config
					.load(brikOptions.config)
					.then(config => {
						// Cache new data.
						brikOptions.config.extends = config.extends;
						data = tim.utils.merge(config.data, data);
						// Reboot all the files. Except the config entry file.
						filepaths.forEach(file => {
							if (file !== brikOptions.config.entry) {
								compileFile(file, brikOptions, data);
							}
						});
					})
					.catch(logError);
			} else {
				compileFile(filepath, brikOptions, data);
			}
		})
		.on('ready', () => {
			tim.log.warn(`\n[ok] Ready! Watching ${filepaths.length} files...\n`);
			tim.log.debug('Filepaths:', '\n    - ' + filepaths.join('\n    - '));
		});
}

/**
 *  Require a file that will be processed as a JS export.
 *
 *  @param   {object}  file  File object passed from compile function.
 *  @param   {object}  [data]  Data to compile file with.
 *  @param   {object}  [options]  Options to compile file with. Typically comes from `<config file>._brik[<name property in .brikrc>]`.
 *  @param   {boolean}  [stringify]  Whether to return a string or object.
 *  @return  {string|object}  Content as a string or object, based on value of stringify.
 */
function requireExportFile(file, { data = {}, options = {}, stringify = true }) {
	let content;

	tim.log.debug(`Compiling as ${file.isJsonExport ? 'JSON' : 'JS'} export:\n    ${file.relative('in')}\n`);

	// Delete require cache for this file.
	delete require.cache[file.in];

	// Require the file.
	content = require(file.in);

	// If the export is a function, call it.
	if (typeof content === 'function') {
		content = content(data, options);
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

/**
 *  Merge user options with defaults.
 *
 *  @param   {options}  options  User options passed from cli or node.
 *  @param   {config}  config  User config returned from loadConfig.
 *  @return  {object}  Merged options object.
 */
function mergeOptions(options = {}, config = {}) {
	const configOptions = config.data._tim && config.data._tim.boot ? config.data._tim.boot : {};
	const userOptions = tim.utils.merge(options, configOptions);
	const defaultOptions = require('../../.brikcssrc-defaults')(userOptions)._tim.boot;

	// Set default options and merge with config file options and options passed directly.
	options = tim.utils.merge(defaultOptions, userOptions);

	// Ensure cwd and output are absolute.
	if (!tim.path.isAbsolute(options.cwd)) {
		options.cwd = tim.path.resolve(options.cwd);
	}
	if (!tim.path.isAbsolute(options.output)) {
		options.output = tim.path.resolve(options.cwd, options.output);
	}

	// Cache user ignored files.
	options.userIgnored = userOptions.ignore;

	// Override globby options that need to be static.
	options.globby.cwd = options.cwd;
	options.globby.ignore = options.ignore;

	// Return options and data.
	options.config = {
		entry: config.entry,
		extends: config.extends
	};

	return options;
}

/* [[END]] -------------------------------------------------------------------------------------- */
