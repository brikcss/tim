/* eslint-env mocha */
const tim = require('./index');

describe('tim/index', () => {
	it('should return undefined', () => {
		tim.assert.equal(tim['non-existing-property'], undefined, 'should be undefined');
	});

	it('expected properties should have correct type', () => {
		const props = {
			function: ['boot', 'sass', 'shots', 'js', 'logify', 'assert', 'rm'],
			object: ['config', 'utils', 'log', 'fs', 'path', 'shell']
		};

		Object.keys(props).forEach(type => {
			props[type].forEach(prop => {
				tim.assert.equal(typeof tim[prop], type, `tim.${prop} should be a ${type}`);
			});
		});
	});

	it('should run a timer', done => {
		const name = 'test';
		tim.utils.timer.start(name);
		tim.assert.equal(typeof tim.utils.timer._[name], 'object', 'new timer should be an object');
		setTimeout(function() {
			tim.utils.timer.stop(name);
			const duration = parseInt(tim.utils.timer.duration(name), 10);
			tim.assert.ok(duration >= 200 && duration < 230, 'timer duration should be between 200ms and 230ms');
			tim.utils.timer.clear(name);
			tim.assert.equal(tim.utils.timer._[name], undefined, 'timer should be undefined');
			done();
		}, 200);
	});

	it('should get root path', () => {
		tim.assert.equal(
			tim.utils.getRoot(tim.path.join(process.cwd(), '**/*')),
			process.cwd(),
			'root path of process.cwd()/**/* should be process.cwd()'
		);
	});

	it('should sort objects', () => {
		tim.assert.deepStrictEqual(
			tim.utils.sortObject({ one: 1, two: 2, three: 3, a: 'a', b: 'b', c: 'c' }),
			{ a: 'a', b: 'b', c: 'c', one: 1, three: 3, two: 2 },
			'should be sorted alphabetically'
		);
		tim.assert.deepStrictEqual(
			tim.utils.sortObject({ one: 1, two: 2, three: 3, a: 'a', b: 'b', c: 'c' }, [
				'c',
				'one',
				'b',
				'three',
				'a',
				'two'
			]),
			{ c: 'c', one: 1, b: 'b', three: 3, a: 'a', two: 2 },
			'should be sorted by sorter'
		);
	});
});
