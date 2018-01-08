/** ------------------------------------------------------------------------------------------------
 *  config/load.js
 *  --------------
 *  @author  brikcss  <https://github.com/brikcss>
 *  @description  Find and load a config file.
 ** --------------------------------------------------------------------------------------------- */

const tim = require('../tim');
const cosmiconfig = require('cosmiconfig');

module.exports = loadConfig;

/**
 *  Finds and loads a config file.
 *
 *  @param  {object}  [options|string]  Options passed to cosmiconfig. Must have either startPath or entry (entry takes precedence). If a string is passed, it will be used as options.startPath. See the `_brik` property in `.brikcssrc-defaults.js` for more details.
 *  @return  {promise}  result: {filepath: '', config: {}}
 */
function loadConfig(options = {}) {
	// If options is a string, use it as the startPath.
	if (typeof options === 'string') options = { startPath: options };
	// Default options.
	options = Object.assign(
		{
			name: 'brikcss',
			startPath: options.entry ? undefined : process.cwd(),
			rcExtensions: true,
			extend: false,
			optionsProp: '_brik'
			// transform: result => transformConfig(result, options)
		},
		options
	);
	return cosmiconfig(options.name, options)
		.load(options.entry ? null : options.startPath, options.entry || null)
		.then(result => {
			// This is what cosmiconfig returns.
			if (!result) result = { filepath: undefined, config: {} };
			// Transform result to what we want to return.
			result = {
				meta: {
					name: options.name,
					success: Boolean(result.filepath),
					startPath: options.entry || options.startPath,
					entry: result.filepath
				},
				data: result.config || {}
			};
			return result;
		});
}

/**
 *  Transforms cosmiconfig's config result. Must return a promise and result must have `filepath` and `config` properties to be used by cosmiconfig.
 *
 *  @param   {object}  result  Cosmiconfig's result: {filepath: '', config: {}}
 *  @param   {object}  options  User options.
 *  @return  {promise}  Returns object like cosmiconfig's result.
 */
function transformConfig(result, options = {}) {
	// Create a deferred promise.
	let deferred = tim.utils.deferred();

	// This is what cosmiconfig returns.
	if (!result) result = { filepath: undefined, config: {} };
	result.extends = result.extends || [];
	options._entry = options._entry || result.filepath;

	// If the config exports a function, call it.
	if (typeof result.config === 'function') {
		result.config = result.config(
			result.config,
			typeof options.optionsProp === 'string' ? result.config[options.optionsProp] : {},
			tim
		);
	}

	// If the config is extended, extend it.
	if (options.extend) {
		// Use `options.optionsProp` for the extends property, if it exists.
		const extendedConfigs =
			typeof options.optionsProp === 'string'
				? result.config[options.optionsProp] ? result.config[options.optionsProp].extends : undefined
				: result.config.extends;
		// If the extends property exists, extend the result.
		if (extendedConfigs && extendedConfigs.length) {
			// Create a log of files we have already extended.
			options._extendedFiles = options._extendedFiles || [options.entry || options.startPath];
			// Iterate over each extended config file.
			(extendedConfigs instanceof Array ? extendedConfigs : [extendedConfigs]).forEach(extendedConfigPath => {
				// Resolve the start path.
				extendedConfigPath = tim.path.isAbsolute(extendedConfigPath)
					? extendedConfigPath
					: tim.path.resolve(tim.path.dirname(result.filepath), extendedConfigPath);
				// Load this config only if it hasn't already been loaded.
				if (options._extendedFiles.indexOf(extendedConfigPath) === -1) {
					const extendedOptions = Object.assign({}, options, {
						entry: undefined,
						startPath: extendedConfigPath
					});
					// Log that this path was extended.
					options._extendedFiles.push(extendedConfigPath);
					// Load the config file.
					deferred.promise = deferred.promise.then(parentConfig => {
						return loadConfig(extendedOptions).then(extendedConfig => {
							// Add the entry file to extends array.
							parentConfig.extends.push(extendedConfig.filepath);
							// Merge the extended config into the parent config.
							return tim.utils.merge(extendedConfig, parentConfig);
						});
					});
				}
			});
		}
	}

	// Resolve the deferred promise to start the promise chain.
	return deferred.resolve(result);
}
