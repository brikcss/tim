/* eslint-env mocha */
const tim = require('../lib/tim');
const timPath = './bin/tim-cli.js';

describe('tim-cli', () => {
	after(() => {
		tim.rm.sync('.temp');
	});

	it('runs the root command', () => {
		const root = tim.shell.exec(`${timPath} root ./bin/tim-cli.js`).stdout;
		tim.assert.equal(typeof root, 'string');
		tim.assert.equal(root.trim(), './bin');
	});

	it('runs the boot command', () => {
		tim.shell.exec(`${timPath} boot 'fixtures/boot/test1/test.md' --output=.temp`);
		tim.assert.equal(tim.fs.readFileSync('.temp/test.md', 'utf8'), '# brikcss component\n');
	});
});
