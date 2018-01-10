module.exports = () => {
	return {
		_brik: {
			name: '@brikcss-test/code-linters',
			precommitHook: true, // boolean or object (object is passed as hook settings).
			watchTask: true,
			css: {
				disable: false,
				mode: 'css', // 'css'|'sass'
				// source: './**/*.{css}', // Set source to override default source, which is all files that match exts.
				exts: ['.css']
			},
			js: {
				disable: false,
				// source: './**/*.{js,xjs,xjson}', // Set source to override default source, which is all files that match exts.
				exts: ['.js', '.xjs', '.xjson']
			},
			json: {
				disable: false,
				exts: ['.json']
			}
		}
	};
};
