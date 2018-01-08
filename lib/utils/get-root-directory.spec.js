const assert = require('assert');
const path = require('path');
const appDir = require('app-root-path').resolve('./');
const getRoot = require('./get-root-directory.js');

describe('utils/get-root-directory', () => {
	it('returns directory from a glob string', () => {
		const expected = path.join(appDir, 'lib');
		const actual = getRoot(path.join(expected, '**/*'));
		assert.equal(actual, expected, 'should be lib directory');
	});

	it('returns root directory for a file path', () => {
		const expected = path.join(appDir, 'lib/utils');
		const actual = getRoot(path.join(expected, '/get-root-directory.js'));
		assert.equal(actual, expected, 'should be lib/utils directory');
	});

	it('returns same directory if string is an existing directory path', () => {
		const expected = path.join(appDir, '/lib/utils');
		const actual = getRoot(expected);
		assert.equal(actual, expected, 'should be lib/utils directory');
	});

	it("returns undefined if the path doesn't exist", () => {
		const actual = getRoot('/non/existent/path');
		assert.equal(actual, undefined, 'should be undefined');
	});
});
