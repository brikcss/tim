const assert = require('assert');
const path = require('path');
const appDir = require('app-root-path').resolve('./');
const getRoot = require('./get-root-directory.js');

describe('utils/get-root-directory', () => {
	it('from glob path', () => {
		const expected = path.join(appDir, 'lib');
		const actual = getRoot(path.join(expected, '**/*'));
		assert.equal(actual, expected, 'should be lib directory');
	});

	it('from file path', () => {
		const expected = path.join(appDir, 'lib/utils');
		const actual = getRoot(path.join(expected, '/get-root-directory.js'));
		assert.equal(actual, expected, 'should be lib/utils directory');
	});

	it('from directory path', () => {
		const expected = path.join(appDir, '/lib/utils');
		const actual = getRoot(expected);
		assert.equal(actual, expected, 'should be lib/utils directory');
	});

	it("that doesn't exist", () => {
		const actual = getRoot('/non/existent/path');
		assert.equal(actual, undefined, 'should be undefined');
	});
});
