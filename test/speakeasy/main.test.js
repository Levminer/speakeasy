"use strict"

const assert = require("assert")
const main = require("../../main")

describe("Main", () => {
	it("should generate a secret", () => {
		const test = main.generateSecret()

		assert.ok(test)
	})

	it("should generate a TOTP", () => {
		const test = main.totp({
			secret: 'secret',
		})

		assert.ok(test);
	})

	it("should verify a TOTP", () => {
		const secret = 'secret'

		const token = main.totp({
			secret
		})
		const test = main.totp.verify({
			secret,
			token
		})

		assert.ok(test);
	})

	it("should verify a TOTP and calculate delta", () => {
		const secret = 'secret'

		const token = main.totp({
			secret
		})
		const test = main.totp.verifyDelta({
			secret,
			token
		})

		assert.deepStrictEqual(test, { delta: 0 })
	})

	it("should generate a HOTP", () => {
		const test = main.hotp({
			secret: 'secret',
		})

		assert.ok(test);
	})

	it("should verify a HOTP", () => {
		const secret = 'secret'

		const token = main.hotp({
			secret
		})
		const test = main.hotp.verify({
			secret,
			token
		})

		assert.ok(test);
	})

	it("should generate a URL and QR code", () => {
		const secret = main.generateSecret()
		const test = main.otpauthURL({
			secret: secret.ascii,
			label: "Name of Secret"
		})

		assert.ok(test);
	})
})
