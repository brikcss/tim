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

function mergeArray(target = [], source, { arrayStrategy = 'unique' } = {}) {
	// Make sure target is an array.
	if (!tim.utils.isArray(target)) target = [target];
	// Merge according to array strategy.
	if (arrayStrategy === 'overwrite') {
		target = source;
	} else if (arrayStrategy === 'unique') {
		target = target.concat(source).filter((item, i, array) => array.indexOf(item) === i);
	} else if (arrayStrategy === 'concat') {
		target = target.concat(source);
	} else {
		target = source;
	}
	return target;
}

function mergeObject(target = {}, source, options = {}) {
	// If both are mergeable and of the same object type, merge them.
	Object.keys(source).forEach(function(key) {
		const value = source[key];

		if (value === target) {
			// Return target if source and target are the same.
			return;
		} else if (!tim.utils.isMergeable(value)) {
			// If source is not mergeable, take the source.
			target[key] = value;
			return;
		} else if (tim.utils.isArray(value)) {
			// If source is an array, merge as an array.
			target[key] = mergeArray(target[key], value, options);
			return;
		} else if (!tim.utils.isMergeable(target[key])) {
			// If source is mergeable and target is not, clone it.
			if (tim.utils.isArray(value)) {
				target[key] = mergeArray([], value, options);
			} else {
				target[key] = mergeObject({}, value, options);
			}
			return;
		} else {
			// Otherwise, merge as an object.
			target[key] = mergeObject(target[key], value, options);
			return;
		}
	});
	return target;
}

function merge(target, source, options = {}) {
	// If source is not mergeable, return the source.
	if (!tim.utils.isMergeable(source)) {
		return source;
	}
	// Merge according as an object or array...
	if (tim.utils.isArray(source)) target = mergeArray(target, source, options);
	else target = mergeObject(target, source, options);
	return target;
}

function mergeEntry(objectsArray, options = {}) {
	// If the first argument is NOT an array, objectsArray = arguments as it is assumed there are no options being passed.
	if (!tim.utils.isArray(objectsArray) || tim.utils.isArray(arguments[1])) {
		objectsArray = Array.prototype.slice.call(arguments, 0);
	}

	// Validate there is at least two items in objectsArray and they are all mergeable.
	if (objectsArray.length < 1) return false;
	if (objectsArray.length < 2) return objectsArray[0];

	// Set target and remove target from objectsArray.
	let target = objectsArray[0];
	objectsArray = objectsArray.slice(1);

	// Reduce all object in array and merge them all.
	objectsArray.forEach(obj => (target = merge(target, obj, options)));

	return target;
}

mergeEntry.one = merge;
mergeEntry.object = mergeObject;
mergeEntry.array = mergeArray;

module.exports = mergeEntry;
