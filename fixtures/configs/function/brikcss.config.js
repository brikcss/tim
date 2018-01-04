module.exports = (data, options, tim) => {
	return {
		name: data.name || 'Function Test',
		functionLoaded: true,
		testPath: tim.path.join(process.cwd(), 'my/test/path'),
		array: [111],
		object: {
			one: 111
		}
	};
};
