/** ------------------------------------------------------------------------------------------------
 *  merge.js
 *  --------
 *  @author  brikcss  <https://github.com/brikcss>
 *  @description  Deep merge utility function to recursively merge objects.
 *  @credit  Thanks to the following since much of the inspiration was taken from their work:
 *           - @kyleamathews <https://github.com/KyleAMathews/deepmerge>
 *           - @unclechu <https://github.com/unclechu/node-deep-extend>
 ** --------------------------------------------------------------------------------------------- */

const tim = require('../tim');

function mergeArray(target, source, { arrayStrategy = 'unique' } = {}) {
	// Merge according to array strategy.
	if (arrayStrategy === 'overwrite') target = source;
	else if (arrayStrategy === 'unique')
		target = target.concat(source).filter((item, i, array) => array.indexOf(item) === i);
	else if (arrayStrategy === 'concat') target = target.concat(source);
	else target = source;
	return target;
}

function mergeObject(target, source, options = {}) {
	// If both are mergeable and of the same object type, merge them.
	Object.keys(source).forEach(function(key) {
		// If property is mergeable, merge it. Otherwise take the source.
		if (tim.utils.isMergeable(source[key])) {
			target[key] = merge(target[key], source[key], options);
		} else {
			target[key] = source[key];
		}
	});
	return target;
}

function merge(target, source, options = {}) {
	// If source or target is not mergeable, or are different object types, return the source.
	if (!tim.utils.isMergeable(source) || !tim.utils.isMergeable(target) || source.constructor !== target.constructor) {
		return source;
	}
	// Merge according as an object or array...
	if (tim.utils.isArray(target)) target = mergeArray(target, source, options);
	else target = mergeObject(target, source, options);
	return target;
}

function mergeEntry(objectsArray, options = {}) {
	// If the first argument is NOT an array, objectsArray = arguments as it is assumed there are no options being passed.
	if (!tim.utils.isArray(objectsArray)) objectsArray = Array.prototype.slice.call(arguments, 0);

	// Validate there is at least two items in objectsArray and they are all mergeable.
	if (objectsArray.length < 1) return false;
	if (objectsArray.length < 2) return objectsArray[0];

	// Reduce all object in array and merge them all.
	return objectsArray.reduce((prev, next) => merge(prev, next, options), {});
}

mergeEntry.one = merge;
mergeEntry.object = mergeObject;
mergeEntry.array = mergeArray;

module.exports = mergeEntry;
