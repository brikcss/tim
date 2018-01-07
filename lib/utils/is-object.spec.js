/* eslint-env mocha */
const tim = require('../tim');

describe('utils/is-object', () => {
	it('returns the correct checks for each data type', () => {
		// No options.
		tim.assert.equal(tim.utils.isObject({}), true);
		tim.assert.equal(tim.utils.isObject(new Object()), true);
		tim.assert.equal(tim.utils.isObject([]), false);
		tim.assert.equal(tim.utils.isObject(null), false);
		tim.assert.equal(tim.utils.isObject(undefined), false);
		tim.assert.equal(tim.utils.isObject(new Date()), false);
		tim.assert.equal(tim.utils.isObject(new RegExp('test')), false);
		tim.assert.equal(tim.utils.isObject(1), false);
		tim.assert.equal(tim.utils.isObject('string'), false);
		tim.assert.equal(tim.utils.isObject(true), false);
		// Array type.
		tim.assert.equal(tim.utils.isObject([], { type: Array }), true);
		tim.assert.equal(tim.utils.isObject({}, { type: Array }), false);
		tim.assert.equal(tim.utils.isArray({}, { type: Array }), false);
		// Special data types.
		tim.assert.equal(tim.utils.isObject({}, { type: Date }), false);
		tim.assert.equal(tim.utils.isObject({}, { type: RegExp }), false);
		tim.assert.equal(tim.utils.isObject(new Date(), { type: Date }), true);
		tim.assert.equal(tim.utils.isObject(new RegExp('test'), { type: RegExp }), true);
		// Mergeables.
		tim.assert.equal(tim.utils.isObject({}, { mergeable: true }), true);
		tim.assert.equal(tim.utils.isObject(new Object(), { mergeable: true }), true);
		tim.assert.equal(tim.utils.isMergeable([], { mergeable: true }), true);
		tim.assert.equal(tim.utils.isMergeable(null, { mergeable: true }), false);
		tim.assert.equal(tim.utils.isObject(undefined, { mergeable: true }), false);
		tim.assert.equal(tim.utils.isObject(new Date(), { mergeable: true }), false);
		tim.assert.equal(tim.utils.isObject(new RegExp('test'), { mergeable: true }), false);
		tim.assert.equal(tim.utils.isObject(1, { mergeable: true }), false);
		tim.assert.equal(tim.utils.isObject('string', { mergeable: true }), false);
		tim.assert.equal(tim.utils.isObject(true, { mergeable: true }), false);
	});
});
