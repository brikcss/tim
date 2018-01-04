/** ------------------------------------------------------------------------------------------------
 *  commitlint.config.js
 *  --------------------
 *  Configuration for commitlint.
 *  @author  brikcss <https://github.com/brikcss>
 ** --------------------------------------------------------------------------------------------- */

module.exports = {
	rules: {
		'header-max-length': [2, 'always', 100],
		'subject-empty': [2, 'never'],
		'subject-full-stop': [2, 'always', '.'],
		'subject-tense': [1, 'always', ['present-imperative']],
		'subject-case': [0, 'never', 'start-case'],
		'body-leading-blank': [2, 'always'],
		'body-tense': [1, 'always', ['present-imperative']],
		'footer-leading-blank': [1, 'always'],
		'footer-tense': [1, 'always', ['present-imperative']],
		lang: [1, 'always', 'eng'],
		// 'scope-case': [2, 'always', 'lowerCase'],
		'scope-enum': [0, 'always', ['css', 'angularjs', 'vanilla']],
		'type-case': [2, 'always', 'lowerCase'],
		'type-empty': [2, 'never'],
		'type-enum': [
			2,
			'always',
			[
				'feat',
				'feature',
				'fix',
				'docs',
				'perf',
				'performance',
				'test',
				'refactor',
				'style',
				'build',
				'tools',
				'chore',
				'revert'
			]
		]
	}
};
