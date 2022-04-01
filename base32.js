/**
 * Generate a character map.
 * @param {string} alphabet e.g. "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
 * @param {CharacterMap} mappings map overrides from key to value
 * @method
 */

const charmap = (alphabet, mappings) => {
	mappings || (mappings = {})
	alphabet.split("").forEach((c, i) => {
		if (!(c in mappings)) mappings[c] = i
	})
	return mappings
}

/**
 * The RFC 4648 base 32 alphabet and character map.
 * @see {@link https://tools.ietf.org/html/rfc4648}
 */

const rfc4648 = {
	alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
	charmap: {
		0: 14,
		1: 8,
	},
}

rfc4648.charmap = charmap(rfc4648.alphabet, rfc4648.charmap)

/**
 * The Crockford base 32 alphabet and character map.
 * @see {@link http://www.crockford.com/wrmg/base32.html}
 */

const crockford = {
	alphabet: "0123456789ABCDEFGHJKMNPQRSTVWXYZ",
	charmap: {
		O: 0,
		I: 1,
		L: 1,
	},
}

crockford.charmap = charmap(crockford.alphabet, crockford.charmap)

/**
 * base32hex
 * @see {@link https://en.wikipedia.org/wiki/Base32#base32hex}
 */

const base32hex = {
	alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
	charmap: {},
}

base32hex.charmap = charmap(base32hex.alphabet, base32hex.charmap)

/**
 * Create a new `Decoder` with the given options.
 *
 * @param {DecoderOptions} [options]
 *   @param {string} [options.type] Supported Base-32 variants are:
 *     "rfc4648", "base32hex", and "crockford".
 *   @param {CharacterMap} [options.charmap] Override the character map used in decoding.
 * @constructor
 */

class Decoder {
	constructor(options) {
		/** @type ByteArray */
		this.buf = []
		this.shift = 8
		this.carry = 0

		if (options) {
			switch (options.type) {
				case "rfc4648":
					this.charmap = exports.rfc4648.charmap
					break
				case "crockford":
					this.charmap = exports.crockford.charmap
					break
				case "base32hex":
					this.charmap = exports.base32hex.charmap
					break
				default:
					throw new Error("invalid type")
			}

			if (options.charmap) this.charmap = options.charmap
		}
	}

	/**
	 * Decode a string, continuing from the previous state.
	 *
	 * @param {string} str
	 * @return {Decoder} this
	 */
	write(str) {
		const charmap = this.charmap
		const buf = this.buf
		let shift = this.shift
		let carry = this.carry

		// decode string
		str.toUpperCase()
			.split("")
			.forEach((char) => {
				// ignore padding
				if (char == "=") return

				// lookup symbol
				const symbol = charmap[char] & 0xff

				// 1: 00000 000
				// 2:          00 00000 0
				// 3:                    0000 0000
				// 4:                             0 00000 00
				// 5:                                       000 00000
				// 6:                                                00000 000
				// 7:                                                         00 00000 0
				shift -= 5
				if (shift > 0) {
					carry |= symbol << shift
				} else if (shift < 0) {
					buf.push(carry | (symbol >> -shift))
					shift += 8
					carry = (symbol << shift) & 0xff
				} else {
					buf.push(carry | symbol)
					shift = 8
					carry = 0
				}
			})

		// save state
		this.shift = shift
		this.carry = carry

		// for chaining
		return this
	}

	/**
	 * Finish decoding.
	 *
	 * @param {string} [str] The final string to decode.
	 * @return {ByteArray} Decoded byte array.
	 */
	finalize(str) {
		if (str) {
			this.write(str)
		}
		if (this.shift !== 8 && this.carry !== 0) {
			this.buf.push(this.carry)
			this.shift = 8
			this.carry = 0
		}
		return this.buf
	}
}

/**
 * The default character map corresponds to RFC4648.
 */

Decoder.prototype.charmap = rfc4648.charmap

/**
 * Create a new `Encoder` with the given options.
 *
 * @param {EncoderOptions} [options]
 *   @param {string} [options.type] Supported Base-32 variants are:
 *     "rfc4648", "base32hex", and "crockford".
 *   @param {string} [options.alphabet] Override the alphabet used in encoding.
 *   @param {boolean} [options.lc] Use lower-case alphabet.
 * @constructor
 */

class Encoder {
	constructor(options) {
		this.buf = ""
		this.shift = 3
		this.carry = 0

		if (options) {
			switch (options.type) {
				case "rfc4648":
					this.alphabet = exports.rfc4648.alphabet
					break
				case "crockford":
					this.alphabet = exports.crockford.alphabet
					break
				case "base32hex":
					this.alphabet = exports.base32hex.alphabet
					break
				default:
					throw new Error("invalid type")
			}

			if (options.alphabet) this.alphabet = options.alphabet
			else if (options.lc) this.alphabet = this.alphabet.toLowerCase()
		}
	}

	/**
	 * Encode a byte array, continuing from the previous state.
	 *
	 * @param {ByteArray} buf The byte array to encode.
	 * @return {Encoder} this
	 */
	write(buf) {
		let shift = this.shift
		let carry = this.carry
		let symbol
		let byte
		let i

		// encode each byte in buf
		for (i = 0; i < buf.length; i++) {
			byte = buf[i]

			// 1: 00000 000
			// 2:          00 00000 0
			// 3:                    0000 0000
			// 4:                             0 00000 00
			// 5:                                       000 00000
			// 6:                                                00000 000
			// 7:                                                         00 00000 0
			symbol = carry | (byte >> shift)
			this.buf += this.alphabet[symbol & 0x1f]

			if (shift > 5) {
				shift -= 5
				symbol = byte >> shift
				this.buf += this.alphabet[symbol & 0x1f]
			}

			shift = 5 - shift
			carry = byte << shift
			shift = 8 - shift
		}

		// save state
		this.shift = shift
		this.carry = carry

		// for chaining
		return this
	}

	/**
	 * Finish encoding.
	 *
	 * @param {ByteArray} [buf] The final byte array to encode.
	 * @return {string} The encoded byte array.
	 */
	finalize(buf) {
		if (buf) {
			this.write(buf)
		}
		if (this.shift !== 3) {
			this.buf += this.alphabet[this.carry & 0x1f]
			this.shift = 3
			this.carry = 0
		}
		return this.buf
	}
}

/**
 * The default alphabet corresponds to RFC4648.
 */

Encoder.prototype.alphabet = rfc4648.alphabet

/**
 * Convenience encoder.
 *
 * @param {ByteArray} buf The byte array to encode.
 * @param {DecoderOptions} [options] Options to pass to the encoder.
 * @return {string} The encoded string.
 */

exports.encode = (buf, options) => {
	return new Encoder(options).finalize(buf)
}

/**
 * Convenience decoder.
 *
 * @param {string} str The string to decode.
 * @param {DecoderOptions} [options] Options to pass to the decoder.
 * @return {ByteArray} The decoded byte array.
 */

exports.decode = (str, options) => {
	return new Decoder(options).finalize(str)
}

// Exports.
exports.Decoder = Decoder
exports.Encoder = Encoder
exports.charmap = charmap
exports.crockford = crockford
exports.rfc4648 = rfc4648
exports.base32hex = base32hex

// Wrap decoder finalize to return a buffer;
const finalizeDecode = Decoder.prototype.finalize
Decoder.prototype.finalize = function (buf) {
	const bytes = finalizeDecode.call(this, buf)
	return Buffer.from(bytes)
}
