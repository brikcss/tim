/* eslint-env mocha */
const tim = require('../tim');
const configsPath = tim.path.join(__dirname, '../../fixtures/configs');

describe('config/load', () => {
	const expectedResult = {
		meta: {
			name: 'brikcss',
			entry: tim.path.join(configsPath, 'configFile/.brikrc.js'),
			success: true
		},
		data: {
			name: '@brikcss-test/test-config-file',
			configLoaded: true
		}
	};

	it('finds and loads a config file with startPath', () => {
		const startPath = tim.path.join(configsPath, 'configFile/one-deep/two-deep');
		return tim.config.load({ name: 'brik', startPath }).then(result => {
			tim.assert.deepEqual(
				result,
				Object.assign({}, expectedResult, {
					meta: Object.assign({}, expectedResult.meta, {
						name: 'brik',
						startPath,
						extends: []
					})
				})
			);
			return;
		});
	});

	it('loads a config file from a specific path with an entry file', () => {
		const startPath = tim.path.join(configsPath, 'configFile/.brikrc.js');
		return tim.config.load({ entry: startPath }).then(result => {
			tim.assert.deepEqual(
				result,
				Object.assign({}, expectedResult, {
					meta: Object.assign({}, expectedResult.meta, {
						startPath,
						extends: []
					})
				})
			);
			return;
		});
	});

	it('extend config file with JS, JSON, and YAML configs', () => {
		const startPath = configsPath + '/extended';
		return tim.config.load({ startPath, extend: '_brik' }).then(result => {
			tim.assert.ok(result.meta.success);
			tim.assert.equal(result.meta.startPath, startPath);
			tim.assert.equal(result.meta.entry, tim.path.join(startPath, '.brikcssrc.js'));
			tim.assert.deepEqual(result.data, {
				name: 'test.js',
				_brik: {
					extends: ['../json/', '../yaml']
				},
				yamlExtendedLoaded: true,
				jsonExtendedLoaded: true,
				yamlLoaded: true,
				jsonLoaded: true,
				jsLoaded: true,
				extendedLoaded: true,
				array: [5, 6, 7, 8, 2, 4, 1, 2, 3, 4],
				object: {
					three: {
						a: 'yes',
						b: false,
						c: 'huh???'
					},
					two: true,
					last: 'all good',
					a: 'yes',
					b: false,
					c: 'huh???',
					one: 1
				}
			});

			// Test extends filetim.paths.
			tim.assert.equal(result.meta.extends.length, 4, 'result.extends has 4 filepaths');
			tim.assert.ok(
				result.meta.extends.indexOf(tim.path.join(configsPath, 'json/.brikcssrc')) > -1,
				'result.meta.extends contains `json/.brikcssrc`'
			);
			tim.assert.ok(
				result.meta.extends.indexOf(tim.path.join(configsPath, 'yaml/.brikcssrc')) > -1,
				'result.meta.extends contains `yaml/.brikcssrc`'
			);
			tim.assert.ok(
				result.meta.extends.indexOf(tim.path.join(configsPath, 'jsonExtended/brikcss.config.js')) > -1,
				'result.meta.extends contains `jsonExtended/brikcss.config.js`'
			);
			tim.assert.ok(
				result.meta.extends.indexOf(tim.path.join(configsPath, 'yamlExtended/brikcss.config.js')) > -1,
				'result.meta.extends contains `yamlExtended/brikcss.config.js`'
			);

			return;
		});
	});

	it("returns empty data if startPath doesn't exist", () => {
		return tim.config.load('/testy-testerson-123456789').then(result => {
			tim.assert.deepEqual(result, {
				meta: {
					name: 'brikcss',
					startPath: '/testy-testerson-123456789',
					entry: undefined,
					extends: [],
					success: true
				},
				data: {}
			});
			return;
		});
	});

	it("returns empty data if config doesn't exist", () => {
		return tim.config.load('/').then(result => {
			tim.assert.deepEqual(result, {
				meta: {
					name: 'brikcss',
					startPath: '/',
					entry: undefined,
					extends: [],
					success: true
				},
				data: {}
			});
			return;
		});
	});
});
