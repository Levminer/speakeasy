module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es2021: true,
		node: true,
	},
	extends: ["standard", "prettier", "plugin:node/recommended"],
	plugins: ["prettier"],
	ignorePatterns: ["/node_modules/*"],
	parserOptions: {
		ecmaVersion: 12,
	},
	rules: {
		indent: ["error", "tab", { SwitchCase: 1 }],
		quotes: ["error", "double"],
		semi: ["error", "never"],
		eqeqeq: ["off"],
		camelcase: ["off"],

		"prettier/prettier": ["warn"],
		"linebreak-style": ["warn", "windows"],
		"prefer-arrow-callback": ["error"],
		"prefer-template": ["error"],
		"node/no-unpublished-require": ["off"],
		"no-unused-vars": ["off"],
		"no-undef": ["off"],
	},
}
