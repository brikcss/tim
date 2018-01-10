/* eslint-env mocha */
const tim = require('../tim');

describe('config/init', () => {
	after(() => {
		tim.rm.sync(tim.path.join(process.cwd(), '.brikcssrc.js'));
	});

	it('creates a new default config file', () => {
		return tim.config.init().then(() => {
			tim.assert.equal(
				tim.fs.readFileSync(tim.path.join(process.cwd(), '.brikcssrc.js'), 'utf8'),
				tim.fs
					.readFileSync(tim.path.join(__dirname, '../../.brikrc-defaults.js'), 'utf8')
					.replace('module.exports = userOptions => {', 'module.exports = (brik) => {')
					.replace(/userOptions.cwd \|\| /g, '')
			);
		});
	});
});
