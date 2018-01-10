module.exports = (brik, { options, tim }) => {
	return {
		name: options.name || 'Function Test',
		functionLoaded: true,
		testPath: tim.path.join(process.cwd(), 'my/test/path'),
		array: [111],
		object: {
			one: 111
		}
	};
};
