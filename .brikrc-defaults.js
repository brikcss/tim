// This file contains possible configuration options for a brik component.
module.exports = userOptions => {
	return {
		_brik: {
			// @property  {string|array}  [files]  String or array of files to compile. Each path is relative to `options.cwd`. Either files OR extends is required.
			files: [],
			// @property  {string|array}  [extends]  NOT YET IMPLEMENTED. String or array of "briks" to compile. Each path is relative to `options.cwd`. Each "brik" can be a glob, directory, file, or array of globs, files, and/or directories.
			// extends: [],
			// @property  {object|string}  [config]  Configuration settings passed to cosmiconfig. A string will be set to `config.startPath`.
			config: {
				// @property  {string}  [name]  Module name passed to cosmiconfig.
				name: 'brikcss',
				// @property  {string}  [startPath]  Start path to start searching for a config file, passed to cosmiconfig's load method as `searchPath`. NOTE: If `entry` exists, `startPath` will be ignored.
				startPath: userOptions.cwd || process.cwd(),
				// @property  {string}  [entry]  Config entry file, passed to cosmiconfig's load method as `configPath`.
				entry: undefined
			},
			// @property  {glob}  [ignore]  Glob of files to ignore. Each glob is relative to `options.cwd`.
			ignore: ['**/brikcss.config.js', '**/.brikcssrc*', '**/.brikrc*', '**/.git/**/*'],
			// @property  {string}  [output]  Directory to output compiled files, relative to `options.cwd`.
			output: userOptions.cwd || process.cwd(),
			// @property  {string}  [cwd]  Changes the current working directory.
			cwd: userOptions.cwd || process.cwd(),
			// @property  {string}  [root]  By default Tim traverses the path at options.files[0] and uses the first existing directory. Only change this setting if that value is incorrect.
			// root: '<first existing directory from options.files[0]>',
			// @property  {boolean}  [overwrite]  Whether to overwrite an existing file. Boolean values sets true/false for all files. To modify this setting on a per-file basis, use the on.overwriteFile callback.
			overwrite: false,
			// @property  {boolean}  [disableGlobs]  Disable glob support. Helps with performance. This will assume any setting which accepts a glob (i.e., options.files, options.ignore, etc.) are filepaths.
			disableGlobs: false,
			// @property  {boolean}  [relativePaths]  Return relative filepaths in file results.
			relativePaths: false,
			// @property  {boolean}  NOT YET IMPLEMENTED. Watch files and compiles change files (incrementally).
			// watch: false,
			// @property  {glob}  [jsExports]  Files that match are compiled as a "JS export" instead of an EJS template. A JS export file is a node/JS module which gets compiled to a file. In other words, the return value of `module.exports` will be the content of the new file (stringified).
			jsExports: ['*.xjs'],
			// @property  {glob}  [jsonExports]  Files that match are compiled as a "JSON export" instead of an EJS template. A JSON export file is a node/JS module which gets compiled to a JSON file. In other words, the return value of `module.exports` will be the content of the new JSON file. Because the compiled file is JSON, the source file must return an object.
			jsonExports: ['*.xjson'],
			// @property  {object}  [jsons]  Applies only to JSON exports. Provides a "base object" for a given output/compiled JSON export filepath. This base will not be overridden. Helpful, for example, with package.json files so you can merge other JSON export files while keeping the base intact. Each child object key is the filepath (relative to options.output) and the value is the base object, in the form of an actual object or a filepath to a JSON file.
			jsons: {},
			// @property  {object}  [on]  Exposes certain functions to allow you to modify certain behavior.
			on: {
				// @property  {function}  [getBrikRoot]  Returns the root path for a brik's filepath or group of filepaths.
				getBrikRoot: (filepath, { brik, tim }) => {
					return tim.utils.getRoot(
						tim.path.resolve(brik.options.cwd, filepath instanceof Array ? filepath[0] : filepath)
					);
				},
				// @property  {function}  [overwriteFile]  Determines whether to overwrite existing file. Must return boolean.
				overwriteFile: (file, { brik, tim }) => false,
				// @property  {function}  [rename]  Allows you to modify the output filepath. Must return a string, which is assigned to file.out.
				rename: (file, { brik, tim }) => file.out,
				// @property  {function}  [compileOrSkip]  Determines whether to compile (true) or skip (false) the file. Must return boolean.
				compileOrSkip: (file, { brik, tim }) => true,
				// @property  {function}  [jsonMerge]  Determines how a json merge is done. Return value is the merged object, which is assigned to file.content and converted to a string.
				jsonMerge: (file, { brik, tim }) => {
					// Must return file.content as an object.
					return file.overwrite
						? Object.assign({}, file.existing, file.content)
						: tim.utils.merge(file.existing, file.content);
				},
				// @property  {function}  [jsonSort]  Sorts the resulting object from a json merge. Return value is sorted object, which is assigned to file.content and converted to a string.
				jsonSort: (file, { brik, tim }) => {
					// Sort object keys based on how the existing file was sorted.
					file.content = tim.utils.sortObject(
						file.content,
						Object.keys(file.existing).concat(Object.keys(file.content))
					);
					// If it is package.json, sort all dependencies in alphabetical order.
					if (tim.path.basename(file.out) === 'package.json') {
						const keysToSort = [
							'dependencies',
							'devDependencies',
							'peerDependencies',
							'bundledDependencies'
						];
						keysToSort.forEach(key => {
							if (file.content[key]) {
								file.content[key] = tim.utils.sortObject(file.content[key]);
							}
						});
					}
					// Must return file.content as an object.
					return file.content;
				}
			},
			// @property  {object}  [globby]  Passed to globby. See https://github.com/sindresorhus/globby. Note that globby.cwd and globby.ignore are overridden by options.cwd and options.ignore.
			globby: {
				dot: true,
				nodir: true,
				matchBase: true
			},
			// @property  {object}  [minimatch]  Passed to minimatch. See https://github.com/isaacs/minimatch.
			minimatch: {
				matchBase: true
			},
			// @property  {object}  [ejs]  Passed to ejs. See https://github.com/mde/ejs.
			ejs: {
				_with: false,
				localsName: 'brik'
			}
		}
	};
};
