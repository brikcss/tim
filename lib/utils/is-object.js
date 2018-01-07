/** ------------------------------------------------------------------------------------------------
 *  mergeable.js
 *  ------------
 *  @author  brikcss  <https://github.com/brikcss>
 *  @description  Checks if a variable is "mergeable", meaning it is an object
 ** --------------------------------------------------------------------------------------------- */

module.exports = (value, { type = Object, mergeable = false } = {}) => {
	// If mergeable, only check if it's an object and can be merged (type of Object or Array).
	if (mergeable) return value instanceof Object && (value.constructor === Object || value.constructor === Array);
	// If no type exists, check if it is any type of object, including dates, regex, etc.
	if (!type) return value === Object(value);
	// Otherwise check if it is the type of object specified.
	return value instanceof Object && value.constructor === type;
};
