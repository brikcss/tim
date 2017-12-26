# To do:

## Next / in progress

- [ ] Create example of multiple boots with extends with `.brikcssrc.js`:
	- [x] Move `_tim.boot` to `_brik`.
	- [ ] In `boot/index.js`, allow for:
		- `_brik.extends`: Compiles a brik/directory of files.
		- `_brik.files`: Compiles files without any other configuration.
	- [ ] Update "multiples" test to work by extending files.
- [ ] Create each of the following "briks" / repos:
	- [ ] Git commit message linting (commitlint)
	- [ ] Code linting:
		- [ ] eslint (including precommit hook)
		- [ ] stylelint (including precommit hook)
	- [ ] Auto release to NPM and github
	- [ ] Git hooks:
		- [ ] Ensure clean stage on commit
		- [ ] Add source branch stamp to commit message
	- [ ] SASS builds
	- [ ] JS / webpack / babel builds
	- [ ] Browsersync local development server
	- [ ] Brik component that glues all the above together. NOTE: Test to make sure we can do this as is. If needed, update Tim and add tests.

## Committed

- [ ] Feature: Add puppeteer browser / UI regression testing.
- [ ] Test: Add unit test to conditionally modify options.files in a brik's options.
- [ ] Documentation: Document `boot` task.
- [ ] Feature: Add npm script to watch mocha tests but only rerun tests that have changed (not all).
- [ ] Refactor: Convert cli helper log to module.
- [ ] Test: Add unit test for tim.boot's watch option.
- [ ] Feature: Add ability to extend configs with required node modules.

## Maybe

- [ ] Feature: Add way to manage local npm package development with `npm link`.
- [ ] Feature: options.copy -> an array of files to copy, not compile.

## Done

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
