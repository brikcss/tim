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
 *  @param   {object}  [options|string]  Options passed to cosmiconfig. Must have either startPath or entry (entry takes precedence). If a string is passed, it will be used as options.startPath. See the `_tim.config` property in `.brikcssrc-defaults.js` for more details.
 *  @return  {promise}  result: {entry: '', data: {}}
 */
function loadConfig(options = {}, configs = {}) {
	// If options is a string, use it as the startPath.
	if (typeof options === 'string') options = { startPath: options };
	// Default options.
	options = Object.assign(
		{
			name: 'brikcss',
			startPath: process.cwd(),
			rcExtensions: true,
			extend: '_tim'
		},
		options
	);

	return cosmiconfig(options.name, options)
		.load(options.entry ? null : options.startPath, options.entry || null)
		.then(result => {
			let promises = [];
			// If no result, return empty object.
			if (result === null) {
				return {};
			}
			// If file has already been loaded, skip it.
			if (!configs[result.filepath]) {
				// Add file to configs cache.
				configs[result.filepath] = result.config;
				// Process the extends property.
				if (options.extend) {
					// Check for custom extends property.
					let extendedFilepaths = result.config.extends || [];
					extendedFilepaths =
						result.config[options.extend] && result.config[options.extend].extends
							? result.config[options.extend].extends
							: [];
					// If there are extended filepaths, load those configs.
					if (extendedFilepaths && extendedFilepaths.length) {
						(extendedFilepaths instanceof Array ? extendedFilepaths : [extendedFilepaths]).forEach(
							filepath => {
								promises.push(
									loadConfig(
										Object.assign({}, options, {
											startPath: tim.path.resolve(tim.path.dirname(result.filepath), filepath)
										}),
										configs
									)
								);
							}
						);
						return Promise.all(promises).then(() => configs);
					}
				}
			}

			// Return the configs map.
			return configs;
		})
		.then(result => {
			let config = {
				meta: {
					name: options.name,
					startPath: options.entry ? options.entry : options.startPath,
					entry: undefined,
					extends: [],
					success: true
				},
				data: {}
			};

			Object.keys(result).forEach((filepath, i) => {
				if (i === 0) {
					config.meta.entry = filepath;
				} else {
					config.meta.extends.push(filepath);
				}
				config.data = tim.utils.merge(result[filepath], config.data);
			});

			return config;
		})
		.catch(error => {
			tim.log.error(error);
			return {
				meta: {
					name: options.name,
					success: false,
					startPath: options.entry ? options.entry : options.startPath,
					entry: undefined,
					extends: []
				},
				data: {}
			};
		});
}
