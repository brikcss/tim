# To do:

## Next / in progress

- [ ] Refactor: boot a brik:
	1. Load entry brik file with tim.config.load().
	1. buildABrik():
		1. If it's the entry brik, set defaults.
		1. If it's not the entry brik (an extended brik):
			1. Use the entry brik for defaults.
			1. Merge with `_briks[<brik name>]`.
		1. Iterate through brik.files:
			1. Form correct absolute paths.
			1. Clone any repos.
		1. Iterate through brik.extends:
			1. Load config for extended / child brik.
			1. Recursively call buildABrik().
			1. Add extended child to an extends map so it doesn't get extended again.
	1. Compile each brik with compileABrik():
		1. Get absolute filepaths with globby or manually, if globby is disabled.
		1. Compile each file.
		1. Notify user.
	1. compileAFile():
		1. Passes {options, data, meta, file, tim} to each compile function.
	1. brik object is formed:
		```js
		let brik = {
			file: {},
			meta: {},
			options: {},
			data: {},
			results: {}
		};
		```
- [ ] Create each of the following "briks" / repos:
	- [x] Git commit message linting (commitlint)
	- [x] Code linting:
		- [x] eslint (including precommit hook)
		- [x] stylelint (including precommit hook)
	- [x] Auto release to NPM and github
	- [x] Git hooks:
		- [x] Ensure clean stage on commit
		- [x] Add source branch stamp to commit message
	- [x] Browsersync local development server
	- [x] Unit testing with mocha
	- [ ] SASS builds
	- [ ] JS / webpack / babel builds
	- [ ] Brik component that glues all the above together. NOTE: Test to make sure we can do this as is. If needed, update Tim and add tests.
	- [ ] Make sure all lines in the components' package.json are accounted for (see at bottom of this doc which lines are left).
- [ ] Document each brik.

## Committed

- [ ] Feature: Add puppeteer browser / UI regression testing.
- [ ] Feature: Extend briks. `_brik.extends` behaves just like `_brik.files` except that it recursively compiles briks, and each "child" brik inherits the config from its "parent".
- [ ] Feature: Complete the brik "watcher" to reboot on changes. See `boot/index.js` file in commit `711e21c3816b5db7364606052b8628928b1a63d5` for old `watchFiles()` function.
- [ ] Test: Add unit test to conditionally modify options.files in a brik's options.
- [ ] Documentation: Document `boot` task.
- [ ] Feature: Add npm script to watch mocha tests but only rerun tests that have changed (not all).
- [ ] Refactor: Convert cli helper log to module.
- [ ] Test: Add unit test for tim.boot's watch option.
- [ ] Feature: Add ability to extend configs with required node modules.

## Maybe

- [ ] Switch to [pnpm](https://www.npmjs.com/package/pnpm) for speed, efficiency, aliases, and hooks.
- [ ] Feature: Add way to manage local npm package development with `npm link`.
- [ ] Feature: options.copy -> an array of files to copy, not compile.

## Done

- [x] Feature: Allow `config._briks` and `config._briks[<brik name>]` to be a function that is called on compile of each brik.
- [x] Feature: `tim.boot`: boot up / scaffold / reboot files and/or projects.
	- [x] Feature: `watch` files and "reboot" / recompile on change (alpha).
	- [x] Feature: Compile via EJS or as JS modules (with .xjs or .xjson).
	- [x] Feature: merge json files (.xjson files).
	- [x] Feature: Expose various stages of the process via callbacks.
	- [x] Feature: Allow brik-specific settings during boot task.
	- [x] Feature: Run on a git repo.
- [x] Feature: `tim.<package>`: Attach commonly used packages to tim, such as `tim.fs`, and
`tim.path`. Each module is loaded on demand, and only attached to tim and cached when it is first
accessed, so there is little to no performance hit to offering so many features with tim.
- [x] Feature: `tim.utils`: Many various utilities and helpers.
- [x] Feature: View code coverage with istanbul.
- [x] Test: Unit tests for working features in tim, tim-cli, and tim.boot.
- [x] Test: Create example of multiple boots with extends with `.brikcssrc.js`:
	- [x] Refactor: Move `_tim.boot` to `_brik`.
	- [x] Feature: In `boot/index.js`, allow for:
		- `_brik.extends`: Compiles a brik/directory of files.
		- `_brik.files`: Compiles files without any other configuration.
	- [x] Test: Update "multiples" test to work by extending files.
	- [x] Refactor: Revisit merging of options?
	- [x] Refactor: Combine options and data into one config object?
- [x] Refactor: `brik` object should _be_ `brik.options`, and all other properties (i.e., `root`, etc.) should be moved to `brik.meta`.
- [x] Refactor: `package.{xjs,xjson}` should be passed `(brik, data)` instead of `(data, brik)`. This should also be changed anywhere else data and brik is passed (brik should come first and be named brik instead of options).

## Original package.json

```js
module.exports = {
	"name": "@brikcss/component",
	"version": "0.0.0-development",
	"description": "A scaffolding / starter repo for brikcss components.",
	"author": "The Zimmee <thezimmee@gmail.com>",
	"license": "MIT",
	"homepage": "https://github.com/brikcss/component",
	"repository": {
		"type": "git",
		"url": "https://github.com/brikcss/component.git"
	},
	"bugs": {
		"url": "https://github.com/brikcss/component/issues"
	},
	"keywords": [
		"brikcss",
		"front end",
		"library",
		"framework",
		"css",
		"js",
		"component",
		"module"
	],
	"main": "src/js/vanilla/component.js",
	"module": "src/js/vanilla/component.js",
	"files": [
		"dist/",
		"src/",
		"examples/",
		"docs/"
	],
	// "config": {
	//	"commitizen": {
	// 		"path": "@commitlint/prompt"
	// 	}
	// },
	"scripts": {
		"// [START]": "Run `npm start` as an alias for development.",
		"start": "npm run watch",
		"// [DEV]": "// Run a development build (not including production tasks, such as minifying files).",
		"dev": "concurrently --names=sass:build,js:build --kill-others-on-fail \"npm run sass:build\" \"npm run js:build -- --no-stats\" || npm run prod:fail",
		"// [WATCH]": "For local development. Watches files, rebuilds when source files change, runs local server with live reload.",
		"watch": "concurrently --raw \"npm run js:watch\" \"npm run sass:watch\" \"npm run serve\"",
		"// [SERVE]": "Run browser-sync for local development server with live reload.",
		"serve": "browser-sync start --config .browsersync.js",
		"// [PROD]": "// Run a clean production / distribution build (runs development and production tasks).",
		"build": "npm run prod",
		"preprod": "npm run test && echo \"\nStarting production build...\n\" && npm run prod:clean",
		"prod": "cross-env NODE_ENV=production concurrently --names=sass:build,js:build --kill-others-on-fail \"npm run sass:build -- --env=prod\" \"npm run js:build\" || npm run prod:fail",
		"postprod": "echo \"\n[ok] Production build complete.\n\"",
		"prod:clean": "rimraf dist .dist .temp --glob=false",
		"prod:fail": "echo \"\n[FAIL] Build failed.\n\" && exit 1",
		"// [TESTS]": "UI and unit tests, as well as code quality checkers.",
		"pretest": "echo \"Running tests...\n\"",
		"test": "npm prune && cross-env NODE_ENV=production concurrently --kill-others-on-fail --names=sass:lint,js:lint \"npm run sass:lint\" \"npm run js:lint\" || npm run test:fail",
		"posttest": "echo \"\n[ok] Tests complete.\n\"",
		"test:fail": "echo \"\n[FAIL] Tests failed.\n\" && exit 1",
		"// [JS]": "// Build JS bundles / flavors with webpack.",
		"js:build": "webpack --display=detailed",
		"js:watch": "chokidar src/**/*.js --command 'node_modules/.bin/eslint {path} --format=stylish && npm run postjs:lint' & npm run js:build -- --watch",
		// "js:lint": "node_modules/.bin/eslint src/**/*.js --format=stylish",
		// "postjs:lint": "echo \"[ok] JS lint complete.\"",
		"// [SASS]": "// Build SASS bundle(s).",
		"sass:build": "node ./lib/tasks/sass-compile.js",
		"sass:watch": "chokidar src/*.scss -c 'stylelint {path} && npm run postsass:lint && npm run sass:build -- --file={path}'",
		// "sass:lint": "stylelint src/*.scss",
		// "postsass:lint": "echo \"[ok] SASS lint complete.\"",
		"// [GIT|HUSKY]": "// Helpers for interacting with git and husky (githooks).",
		// "commit": "echo \"See the \"git commit policy\" in CONTRIBUTING.md for details on how to write a valid commit message.\n\" && git-cz",
		// "commitmsg": "commitlint -e $GIT_PARAMS",
		"preparecommitmsg": "lib/hooks/prepare-commit-msg.sh ${GIT_PARAMS}",
		"// prepush:": "Runs the production build and checks for a clean state (excluding untracked files).",
		"prepush": "npm run git:checkstage && npm run prod && npm run git:checkstage && echo \"\nPushing code...\n\"",
		"git:checkstage": ". ./lib/hooks/ensure-clean-stage.sh",
		"// [RELEASE]": "Semantic release manages our release process.",
		"release": "semantic-release pre && npm publish && semantic-release post",
		"semantic-release": "semantic-release pre && npm publish && semantic-release post"
	},
	"release": {
		"branch": "master",
		"analyzeCommits": {
			"preset": "angular",
			"releaseRules": "./.release-rules.js",
			"parserOpts": {
				"noteKeywords": [
					"BREAKING CHANGE",
					"BREAKING CHANGES",
					"BREAKING"
				]
			}
		}
	},
	"publishConfig": {
		"tag": "dev"
	},
	"devDependencies": {
		// "@brikcss/eslint-config": "0.1.1",
		// "@brikcss/stylelint-config-sass": "0.0.3",
		// "@commitlint/cli": "^4.2.2",
		// "@commitlint/prompt": "^4.2.2",
		"app-root-path": "2.0.1",
		"autoprefixer": "^7.1.4",
		"babel-cli": "^6.26.0",
		"babel-core": "^6.26.0",
		"babel-eslint": "^8.0.1",
		"babel-loader": "^7.1.2",
		"babel-plugin-add-module-exports": "^0.2.1",
		"babel-polyfill": "^6.26.0",
		"babel-preset-env": "^1.6.1",
		"babel-preset-es2015": "^6.24.1",
		"browser-sync": "^2.18.13",
		"chokidar-cli": "^1.2.0",
		// "commitizen": "^2.9.6",
		"concurrently": "3.5.0",
		"cross-env": "^5.1.1",
		"csso": "^3.3.1",
		// "eslint": "^4.9.0",
		"eslint-loader": "^1.9.0",
		"fs-extra": "^4.0.2",
		"husky": "^0.14.3",
		"minimatch": "3.0.4",
		"minimist": "^1.2.0",
		"node-sass": "^4.5.3",
		"node-sass-magic-importer": "5.0.0-alpha.17",
		"path-extra": "^4.2.1",
		"postcss": "^6.0.13",
		"postcss-cli": "4.1.1",
		"postcss-reporter": "5.0.0",
		"postcss-scss": "1.0.2",
		"rimraf": "^2.6.2",
		"sass": "^1.0.0-beta.2",
		"semantic-release": "^8.2.0",
		// "stylelint": "8.2.0",
		// "stylelint-config-recommended": "1.0.0",
		// "stylelint-scss": "2.1.0",
		"webpack": "3.8.1"
	}
}
```
