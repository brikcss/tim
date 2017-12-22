/* eslint-env mocha */
const tim = require('../tim');
const cwd = process.cwd();
tim.log.setLevel(process.env.LOG || 'error');

describe('boot/index', () => {
	after('clean up artifacts', () => {
		tim.rm.sync(tim.path.join(cwd, '.temp'));
	});

	describe('EJS', () => {
		const sourceMdPath = tim.path.resolve(__dirname, '../../fixtures/boot/test1/test.md');
		const outputMdPath = tim.path.join(cwd, 'test.md');

		after('clean up', () => {
			tim.rm.sync(outputMdPath);
		});

		it('boots EJS template to ./test.md', () => {
			return tim.boot(sourceMdPath, { name: 'Test Run 1' }).then(result => {
				tim.assert.ok(allFilesSuccessful(result.files), 'should be successful');
				tim.assert.equal(
					tim.fs.readFileSync(outputMdPath, 'utf8'),
					'# Test Run 1\n',
					'./test.md should match expected output'
				);
				return;
			});
		});

		it("doesn't overwrite existing file", () => {
			return tim.boot(sourceMdPath, { name: 'Test Run 2' }).then(result => {
				tim.assert.ok(allFilesSuccessful(result.files, true), 'should be successful');
				tim.assert.equal(
					tim.fs.readFileSync(outputMdPath, 'utf8'),
					'# Test Run 1\n',
					'output file should not be changed'
				);
				return;
			});
		});

		it('overwrites file with overwrite = true', () => {
			return tim.boot({ files: sourceMdPath, overwrite: true }, { name: 'Test Run 3' }).then(result => {
				tim.assert.ok(allFilesSuccessful(result.files), 'should be successful');
				tim.assert.equal(
					tim.fs.readFileSync(outputMdPath, 'utf8'),
					'# Test Run 3\n',
					'output file should have changed'
				);
				return;
			});
		});

		it('overwrites file with overwrite = function', () => {
			return tim.boot({ files: sourceMdPath, overwrite: '*test.md' }, { name: 'Test Run 5' }).then(result => {
				tim.assert.ok(allFilesSuccessful(result.files), 'should be successful');
				tim.assert.equal(
					tim.fs.readFileSync(outputMdPath, 'utf8'),
					'# Test Run 5\n',
					'output file should have changed'
				);
				return;
			});
		});
	});

	describe('XJS', () => {
		const sourceXjsPath = tim.path.resolve(__dirname, '../../fixtures/boot/test1/test2.md.xjs');
		const outputMdPath2 = tim.path.join(cwd, 'test2.md');

		after('clean up', () => {
			tim.rm.sync(outputMdPath2);
		});

		it('boots an .xjs file', () => {
			return tim.boot({ files: sourceXjsPath, overwrite: true }, { name: '.xjs Test Run\n' }).then(result => {
				tim.assert.ok(allFilesSuccessful(result.files), 'should be successful');
				tim.assert.equal(
					tim.fs.readFileSync(outputMdPath2, 'utf8'),
					'# .xjs Test Run\n',
					'output file should match expected'
				);
				return;
			});
		});
	});

	describe('XJSON', () => {
		const outputXjsonPath = tim.path.join(cwd, 'test.json');

		after('clean up', () => {
			tim.rm.sync(outputXjsonPath);
		});

		it('boots an .xjson file', () => {
			return tim
				.boot(
					{ files: tim.path.resolve(__dirname, '../../fixtures/boot/test1/test.xjson') },
					{ custom: [1, 2, 3, 4] }
				)
				.then(result => {
					tim.assert.ok(allFilesSuccessful(result.files), 'should be successful');
					tim.assert.equal(
						tim.fs.readFileSync(outputXjsonPath, 'utf8'),
						`{
	"one": 1,
	"two": 2,
	"three": 3,
	"a": "a",
	"b": "b",
	"c": "c",
	"custom": [
		1,
		2,
		3,
		4
	]
}`,
						'should match expected output with custom data'
					);
					return;
				});
		});

		it('merges .xjson file with existing .json', () => {
			return tim
				.boot(
					{
						files: tim.path.resolve(__dirname, '../../fixtures/boot/test1/test2.xjson'),
						on: {
							rename: file => {
								return file.out.replace('test2', 'test');
							}
						}
					},
					{}
				)
				.then(result => {
					tim.assert.ok(allFilesSuccessful(result.files), 'should be successful');
					tim.assert.equal(
						tim.fs.readFileSync(outputXjsonPath, 'utf8'),
						`{
	"one": 1,
	"two": 2,
	"three": 3,
	"a": "a",
	"b": "b",
	"c": "c",
	"custom": [
		1,
		2,
		3,
		4,
		9,
		8,
		7,
		6
	]
}`,
						'output file should match expected with custom: [9, 8, 7, 6]'
					);
					return;
				});
		});

		it('merges .xjson file with existing .json and overwrites properties', () => {
			return tim
				.boot(
					{
						files: tim.path.resolve(__dirname, '../../fixtures/boot/test2/test2.xjson'),
						overwrite: true,
						on: {
							rename: file => {
								return file.out.replace('test2', 'test');
							}
						}
					},
					{}
				)
				.then(result => {
					tim.assert.ok(allFilesSuccessful(result.files), 'should be successful');
					tim.assert.equal(
						tim.fs.readFileSync(outputXjsonPath, 'utf8'),
						`{
	"one": 11111,
	"two": 2,
	"three": 3,
	"a": "a",
	"b": "bbbbb",
	"c": "c",
	"custom": [
		5
	]
}`,
						'output file should match expected with custom: [9, 8, 7, 6]'
					);
					return;
				});
		});
	});

	describe('options.files, options.cwd, and options.relativePaths', () => {
		const outputFile = tim.path.join(cwd, 'test.md');

		afterEach('clean up', () => {
			tim.rm.sync(outputFile);
		});

		it('throws error when no options.files is undefined', () => {
			tim.assert.throws(tim.boot);
		});

		it('throws error when options.files is not a string or Array', () => {
			tim.assert.throws(function() {
				return tim.boot({
					files: { one: 1 }
				});
			});
		});

		it('boots directory of files', () => {
			const outputDir = tim.path.join(cwd, '.temp/test1');
			return tim
				.boot({
					files: tim.path.resolve(__dirname, '../../fixtures/boot/test1'),
					output: outputDir
				})
				.then(result => {
					const filepaths = [
						tim.path.join(outputDir, 'ignore.txt'),
						tim.path.join(outputDir, 'test.json'),
						tim.path.join(outputDir, 'test.md'),
						tim.path.join(outputDir, 'test2.md'),
						tim.path.join(outputDir, 'test2.json')
					];
					tim.assert.deepEqual(result.filepaths.out.sort(), filepaths.sort());
					tim.assert.ok(
						allFilesSuccessful(result.files),
						'should be successful',
						'all should be successful and not skipped'
					);

					return tim.globby(outputDir).then(actualFilepaths => {
						tim.assert.deepEqual(
							actualFilepaths.sort(),
							filepaths.sort(),
							'only non-skipped files should be compiled'
						);
						return;
					});
				});
		});

		it('boots glob of files', () => {
			const outputDir = tim.path.join(cwd, '.temp/test2');
			return tim
				.boot({
					files: tim.path.resolve(__dirname, '../../fixtures/boot/test1'),
					output: outputDir,
					relativePaths: true,
					ignore: ['**/*.txt']
				})
				.then(result => {
					const filepaths = [
						'.temp/test2/test.json',
						'.temp/test2/test.md',
						'.temp/test2/test2.md',
						'.temp/test2/test2.json'
					];
					tim.assert.deepEqual(result.filepaths.out.sort(), filepaths.sort());
					tim.assert.ok(allFilesSuccessful(result.files), 'should be successful');

					return tim.globby('.temp/test2/*').then(actualFilepaths => {
						tim.assert.deepEqual(
							actualFilepaths.sort(),
							filepaths.sort(),
							'only non-skipped files should be compiled'
						);
						return;
					});
				});
		});

		it('runs files relative to process.cwd() (default)', () => {
			return tim.boot('fixtures/boot/test1/test.md').then(result => {
				tim.assert.ok(allFilesSuccessful(result.files), 'should be successful');
				tim.assert.equal(
					tim.fs.readFileSync(outputFile, 'utf8'),
					'# brikcss component\n',
					'./test.md should match expected output'
				);
				return;
			});
		});

		it('runs files relative to options.cwd', () => {
			return tim
				.boot({
					cwd: __dirname,
					output: process.cwd(),
					files: '../../fixtures/boot/test1/test.md'
				})
				.then(result => {
					tim.assert.ok(allFilesSuccessful(result.files), 'should be successful');
					tim.assert.equal(
						tim.fs.readFileSync(outputFile, 'utf8'),
						'# brikcss component\n',
						'./test.md should match expected output'
					);
					return;
				});
		});
	});

	describe('options.config', () => {
		const outputFile = tim.path.join(cwd, 'test.md');

		afterEach('clean up', () => {
			tim.rm.sync(outputFile);
		});

		it('runs despite not finding a config file', () => {
			return tim
				.boot({
					config: tim.path.join(require('os').homedir(), 'non/existent/path'),
					files: 'fixtures/boot/test1/test.md'
				})
				.then(result => {
					tim.assert.ok(allFilesSuccessful(result.files), 'should be successful');
					tim.assert.equal(
						tim.fs.readFileSync(outputFile, 'utf8'),
						'# brikcss component\n',
						'./test.md should match expected output'
					);
					return;
				});
		});

		it('runs with options.config as a string', () => {
			return tim
				.boot({
					config: 'fixtures/configs/brikcss.config.js',
					files: 'fixtures/boot/test1/test.md'
				})
				.then(result => {
					tim.assert.ok(allFilesSuccessful(result.files), 'should be successful');
					tim.assert.equal(
						tim.fs.readFileSync(outputFile, 'utf8'),
						'# test.js\n',
						'./test.md should match expected output'
					);
					return;
				});
		});

		it('runs with options.config as a file', () => {
			return tim
				.boot({
					config: {
						entry: 'fixtures/configs/brikcss.config.js'
					},
					files: 'fixtures/boot/test1/test.md'
				})
				.then(result => {
					tim.assert.ok(allFilesSuccessful(result.files), 'should be successful');
					tim.assert.equal(
						tim.fs.readFileSync(outputFile, 'utf8'),
						'# test.js\n',
						'./test.md should match expected output'
					);
					return;
				});
		});
	});

	describe('options.disableGlobs', () => {
		const outputFile = tim.path.join(cwd, '.temp/test.md');

		it('runs with disableGlobs and absolute paths', () => {
			return tim
				.boot({ disableGlobs: true, output: '.temp', files: 'fixtures/boot/test1/test.md' })
				.then(result => {
					tim.assert.ok(allFilesSuccessful(result.files), 'should be successful');
					tim.assert.equal(tim.fs.readFileSync(outputFile, 'utf8'), '# brikcss component\n');
					return;
				});
		});
	});

	describe('options.jsons', () => {
		const expected = {
			name: '@brikcss/my-custom-component',
			version: '0.0.0-development',
			description: 'This is my amazing custom component',
			author: 'The Zimmee <thezimmee@gmail.com>',
			homepage: 'https://github.com/brikcss/tim'
		};
		const jsons = {
			'test-jsons-base.json': {
				name: '@brikcss/my-custom-component',
				description: 'This is my amazing custom component'
			},
			'test-jsons-base-path.json': 'test-path.json',
			'test-jsons-base-blank-path.json': ''
		};

		it('boots with base json data', () => {
			return tim
				.boot({
					cwd: 'fixtures/boot/jsons-base',
					output: tim.path.join(process.cwd(), '.temp'),
					jsons,
					files: '.'
				})
				.then(result => {
					tim.assert.ok(allFilesSuccessful(result.files));
					tim.assert.deepEqual(
						tim.fs.readJsonSync(tim.path.join(cwd, '.temp/test-jsons-base.json'), 'utf8'),
						expected
					);
				});
		});

		it('boots with a path to base json', () => {
			return tim
				.boot({
					cwd: 'fixtures/boot/jsons-base',
					output: '../../../.temp',
					files: 'test-jsons-base.xjson',
					jsons,
					on: {
						rename(file) {
							return file.out.replace('test-jsons-base.json', 'test-jsons-base-path.json');
						}
					}
				})
				.then(result => {
					tim.assert.ok(allFilesSuccessful(result.files));
					tim.assert.deepEqual(
						tim.fs.readJsonSync(tim.path.join(cwd, '.temp/test-jsons-base-path.json'), 'utf8'),
						Object.assign(expected, {
							name: '@brikcss/my-other-custom-component',
							description: 'This is my OTHER amazing custom component'
						})
					);
				});
		});

		it("throws error when base json path doesn't exist", () => {
			return tim
				.boot({
					cwd: 'fixtures/boot/jsons-base',
					output: '.temp',
					files: 'test-jsons-base.xjson',
					jsons,
					on: {
						rename(file) {
							return file.out.replace('test-jsons-base.json', 'test-jsons-base-blank-path.json');
						}
					}
				})
				.then(result => {
					tim.assert.ok(result instanceof Error);
				});
		});
	});

	describe('compileOrSkip callback', () => {
		it('skips all files which return false', () => {
			const outputDir = tim.path.join(cwd, '.temp/compileOrSkip');
			return tim
				.boot({
					files: tim.path.resolve(__dirname, '../../fixtures/boot/test1'),
					output: outputDir,
					on: {
						compileOrSkip: (file, { tim }) => {
							const skipThese = ['ignore.txt', 'test.md', 'test2.md'];
							return skipThese.indexOf(tim.path.basename(file.out)) === -1;
						}
					}
				})
				.then(result => {
					const skipped = [
						tim.path.join(outputDir, 'ignore.txt'),
						tim.path.join(outputDir, 'test.md'),
						tim.path.join(outputDir, 'test2.md')
					];
					const success = [tim.path.join(outputDir, 'test.json'), tim.path.join(outputDir, 'test2.json')];
					return tim.globby(outputDir).then(actualFilepaths => {
						tim.assert.deepEqual(
							result.filepaths.out.sort(),
							skipped.concat(success).sort(),
							'all should be successful'
						);
						tim.assert.deepEqual(
							actualFilepaths.sort(),
							success.sort(),
							'only non-skipped files should be compiled'
						);
						return;
					});
				});
		});
	});

	describe('boots individual briks with .brikrc files', () => {
		it('ignores files according to .brikrc config');

		it('boots multiple "briks" / folders into one', () => {
			return tim
				.boot(
					{
						files: ['fixtures/boot/multiple/commitlint', 'fixtures/boot/multiple/code-linters'],
						output: '.temp/multiple'
					},
					{
						eslintIgnore: 'test/**/*.js'
					}
				)
				.then(() => {
					const filesEqualToTheirSource = [
						'commitlint/commitlint.config.js',
						'code-linters/.stylelintrc.js',
						'code-linters/.eslintrc.js',
						'code-linters/lib/hooks/lint-staged-files.js'
					];
					tim.assert.equal(tim.fs.pathExistsSync('.temp/multiple/.brikrc.js'), false);
					filesEqualToTheirSource.forEach(filepath => {
						tim.assert.equal(
							tim.fs.readFileSync(
								tim.path.join(
									'.temp/multiple',
									filepath
										.split('/')
										.slice(1)
										.join('/')
								),
								'utf8'
							),
							tim.fs.readFileSync(tim.path.join('fixtures/boot/multiple', filepath), 'utf8')
						);
					});
					tim.assert.equal(
						tim.fs.readFileSync('.temp/multiple/.eslintignore', 'utf8'),
						'## -------------------------------------------------------------------------------------------------\n# .eslintignore\n# -------------\n# @author  brikcss <https://github.com/brikcss>\n# @description  Files to ignore by [eslint](https://eslint.org/docs/user-guide/configuring#ignoring-files-and-directories).\n## -------------------------------------------------------------------------------------------------\n\ntest/**/*.js\n'
					);
					tim.assert.deepEqual(tim.fs.readJsonSync('.temp/multiple/package.json', 'utf8'), {
						scripts: {
							gcz:
								'echo "See the "git commit policy" in CONTRIBUTING.md for details on how to write a valid commit message.\n" && git-cz',
							commitmsg: 'commitlint -e $GIT_PARAMS',
							precommit:
								'node ./lib/hooks/lint-staged-files.js --css=.css --js=.js,.xjs,.xjson --json=.json'
						},
						devDependencies: {
							'@commitlint/cli': '^4.2.2',
							commitizen: '^2.9.6'
						}
					});
				});
		});
	});

	describe('boots git repositories', () => {
		const files = [
			'gh:brikcss/boot-test',
			'git@github.com:brikcss/boot-test.git',
			'https://github.com/brikcss/boot-test.git'
		];
		// Only run these in production.
		if (process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production') {
			files.forEach(file => {
				it(`boots a github repo with ${file.split('@')[0].split(':')[0]}`, () => {
					return tim
						.boot(
							{
								files: file,
								output: '.temp/gh'
							},
							{
								headline: 'Tim I am.',
								holla: 'Hello world!!',
								greeting: 'Hello there. This is your warm greeting.'
							}
						)
						.then(result => {
							tim.assert.deepEqual(tim.fs.readJsonSync('.temp/gh/package.json', 'utf8'), {
								scripts: {
									test: 'echo "I am a test. Hello world!!!"'
								}
							});
							tim.assert.equal(
								tim.fs.readFileSync('.temp/gh/README.md', 'utf8'),
								'# boot-test\n\nTim I am.\n'
							);
							tim.assert.equal(
								tim.fs.readFileSync('.temp/gh/TODO.md', 'utf8'),
								'# Test git repo\n\nHello there. This is your warm greeting.'
							);
							return tim.globby('.temp/gh').then(actualFilepaths => {
								tim.assert.deepEqual(
									actualFilepaths.sort(),
									['.temp/gh/README.md', '.temp/gh/TODO.md', '.temp/gh/package.json'].sort(),
									'only non-skipped files should be compiled'
								);
								return result;
							});
						});
				});
			});
		}

		it('boots a git repo and local directory together', () => {
			return tim
				.boot(
					{
						files: ['gh@brikcss/boot-test', 'fixtures/boot/multiple/commitlint'],
						output: '.temp/gh2',
						enablePrompt: true
					},
					{
						headline: 'Tim I am.',
						holla: 'Hello world!!',
						greeting: 'Hello there. This is your warm greeting.',
						_briks: {
							'@brikcss-test/commitlint': {
								enablePrompt: true
							}
						}
					}
				)
				.then(result => {
					tim.assert.deepEqual(tim.fs.readJsonSync('.temp/gh2/package.json', 'utf8'), {
						scripts: {
							test: 'echo "I am a test. Hello world!!!"',
							gcz:
								'echo "See the "git commit policy" in CONTRIBUTING.md for details on how to write a valid commit message.\n" && git-cz',
							commitmsg: 'commitlint -e $GIT_PARAMS'
						},
						devDependencies: {
							'@commitlint/cli': '^4.2.2',
							'@commitlint/prompt': '^4.2.2',
							commitizen: '^2.9.6'
						},
						config: {
							commitizen: {
								path: '@commitlint/prompt'
							}
						}
					});
					tim.assert.equal(tim.fs.readFileSync('.temp/gh2/README.md', 'utf8'), '# boot-test\n\nTim I am.\n');
					tim.assert.equal(
						tim.fs.readFileSync('.temp/gh2/TODO.md', 'utf8'),
						'# Test git repo\n\nHello there. This is your warm greeting.'
					);
					return tim.globby('.temp/gh2').then(actualFilepaths => {
						tim.assert.deepEqual(
							actualFilepaths.sort(),
							[
								'.temp/gh2/README.md',
								'.temp/gh2/TODO.md',
								'.temp/gh2/package.json',
								'.temp/gh2/commitlint.config.js'
							].sort(),
							'only non-skipped files should be compiled'
						);
						return result;
					});
				});
		});
	});
});

function allFilesSuccessful(files, skipped) {
	return files.every(file => file.success && file.skip === Boolean(skipped));
}
