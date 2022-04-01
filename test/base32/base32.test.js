"use strict"

const assert = require("assert")
const base32 = require("../../base32")
const fixtures = require("./fixtures")

describe("Decoder", () => {
	fixtures.forEach((subject) => {
		const test = subject.buf

		subject.rfc4648.forEach((str) => {
			it(`should decode rfc4648 ${str}`, () => {
				const decoder = new base32.Decoder({ type: "rfc4648" })
				const decoded = decoder.write(str).finalize()
				compare(decoded, test)
				const s = new base32.Decoder().write(str).finalize()
				compare(s, test)
			})
		})

		subject.crock32.forEach((str) => {
			it(`should decode crock32 ${str}`, () => {
				const decoder = new base32.Decoder({ type: "crockford" })
				const decoded = decoder.write(str).finalize()
				compare(decoded, test)
			})
		})

		subject.base32hex.forEach((str) => {
			it(`should decode base32hex ${str}`, () => {
				const decoder = new base32.Decoder({ type: "base32hex" })
				const decoded = decoder.write(str).finalize()
				compare(decoded, test)
			})
		})
	})
})

describe("Encoder", () => {
	fixtures.forEach((subject) => {
		const buf = subject.buf

		it(`should encode rfc4648 ${buf}`, () => {
			const test = subject.rfc4648[0]
			const encoder = new base32.Encoder({ type: "rfc4648" })
			const encode = encoder.write(buf).finalize()
			assert.equal(encode, test)
			const s = new base32.Encoder().write(buf).finalize()
			assert.equal(s, test)
		})

		it(`should encode crock32 ${buf}`, () => {
			const test = subject.crock32[0]
			const encoder = new base32.Encoder({ type: "crockford" })
			const encoded = encoder.write(buf).finalize()
			assert.equal(encoded, test)
		})

		it(`should encode crock32 ${buf} with lower case`, () => {
			const test = subject.crock32[0]
			const encoder = new base32.Encoder({ type: "crockford", lc: true })
			const encoded = encoder.write(buf).finalize()
			assert.equal(encoded, test.toLowerCase())
		})

		it(`should encode base32hex ${buf} with lower case`, () => {
			const test = subject.base32hex[0]
			const encoder = new base32.Encoder({ type: "base32hex", lc: true })
			const encoded = encoder.write(buf).finalize()
			assert.equal(encoded, test.toLowerCase())
		})
	})
})

function compare(a, b) {
	if (typeof Buffer != "undefined") {
		b = Buffer.from(b)
		return assert.strictEqual(b.compare(a), 0)
	}
	assert.deepEqual(a, b)
}
