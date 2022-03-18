module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es2021: true,
		node: true,
	},
	extends: ["standard", "eslint:recommended", "plugin:node/recommended", "plugin:promise/recommended", "plugin:prettier/recommended"],
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
		"no-undef": ["off"],
	},
}
