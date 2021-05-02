# @levminer/speakeasy

-   This is a fork of the original speakeasy. I'm just modernized and fixed some stuff:

1. Use Buffer.alloc() and Buffer.from() instead deprecated new Buffer

1. ES6 syntax: let, const, arrow functions

1. Fixed some known bugs

1. Import syntax

---

## Are you looking for a desktop cross platform two-factor authentication app? Check out: [Authme](https://github.com/levminer/authme)

---

**Jump to** — [Install](#install) · [General Usage](#general-usage) · [Documentation](#documentation) · [Contributing](#contributing) · [License](#license)

---

Speakeasy is a one-time passcode generator, ideal for use in two-factor
authentication, that supports Google Authenticator and other two-factor devices.

It is well-tested and includes robust support for custom token lengths,
authentication windows, hash algorithms like SHA256 and SHA512, and other
features, and includes helpers like a secret key generator.

Speakeasy implements one-time passcode generators as standardized by the
[Initiative for Open Authentication (OATH)][oath]. The HMAC-Based One-Time
Password (HOTP) algorithm defined by [RFC 4226][rfc4226] and the Time-Based
One-time Password (TOTP) algorithm defined in [RFC 6238][rfc6238] are
supported. This project incorporates code from [passcode][], originally a
fork of Speakeasy, and [notp][].

<a name="install"></a>

## Install

```js
npm i @levminer/speakeasy
```

<a name="general-usage"></a>

## General Usage

```js
//require
const speakeasy = require("@levminer/speakeasy")

//import
import speakeasy from "@levminer/speakeasy"
```

#### Generating a key

```js
// Generate a secret key.
let secret = speakeasy.generateSecret({ length: 20 })
// Access using secret.ascii, secret.hex, or secret.base32.
```

#### Getting a time-based token for the current time

```js
// Generate a time-based token based on the base-32 key.
// HOTP (counter-based tokens) can also be used if `totp` is replaced by
// `hotp` (i.e. speakeasy.hotp()) and a `counter` is given in the options.
let token = speakeasy.totp({
	secret: secret.base32,
	encoding: "base32",
})

// Returns token for the secret at the current time
// Compare this to user input
```

#### Verifying a token

```js
// Verify a given token
let tokenValidates = speakeasy.totp.verify({
	secret: secret.base32,
	encoding: "base32",
	token: "123456",
	window: 6,
})
// Returns true if the token matches
```

#### Verifying a token and calculating a delta

A TOTP is incremented every `step` time-step seconds. By default, the time-step
is 30 seconds. You may change the time-step using the `step` option, with units
in seconds.

```js
// Verify a given token is within 3 time-steps (+/- 2 minutes) from the server
// time-step.
let tokenDelta = speakeasy.totp.verifyDelta({
	secret: secret.base32,
	encoding: "base32",
	token: "123456",
	window: 2,
	step: 60,
})
// Returns {delta: 0} where the delta is the time step difference
// between the given token and the current time
```

#### Getting a time-based token for a custom time

```js
let token = speakeasy.totp({
	secret: secret.base32,
	encoding: "base32",
	time: 1453667708, // specified in seconds
})

// Verify a time-based token for a custom time
let tokenValidates = speakeasy.totp.verify({
	secret: secret.base32,
	encoding: "base32",
	token: token,
	time: 1453667708,
})
```

#### Calculating a counter-based token

```js
// Get a counter-based token
let token = speakeasy.hotp({
	secret: secret.base32,
	encoding: "base32",
	counter: 123,
})

// Verify a counter-based token
let tokenValidates = speakeasy.hotp.verify({
	secret: secret.base32,
	encoding: "base32",
	token: "123456",
	counter: 123,
})
```

#### Using other encodings

The default encoding (when `encoding` is not specified) is `ascii`.

```js
// Specifying an ASCII token for TOTP
// (encoding is 'ascii' by default)
let token = speakeasy.totp({
	secret: secret.ascii,
})
```

```js
// Specifying a hex token for TOTP
let token = speakeasy.totp({
	secret: secret.hex,
	encoding: "hex",
})
```

#### Using other hash algorithms

The default hash algorithm is SHA1.

```js
// Specifying SHA256
let token = speakeasy.totp({
	secret: secret.ascii,
	algorithm: "sha256",
})
```

```js
// Specifying SHA512
let token = speakeasy.totp({
	secret: secret.ascii,
	algorithm: "sha512",
})
```

#### Getting an otpauth:// URL and QR code for non-SHA1 hash algorithms

```js
// Generate a secret, if needed
let secret = speakeasy.generateSecret()
// By default, generateSecret() returns an otpauth_url for SHA1

// Use otpauthURL() to get a custom authentication URL for SHA512
let url = speakeasy.otpauthURL({ secret: secret.ascii, label: "Name of Secret", algorithm: "sha512" })

// Pass URL into a QR code generator
```

#### Specifying a window for verifying HOTP and TOTP

Verify a HOTP token with counter value 42 and a window of 10. HOTP has a one-sided window, so this will check counter values from 42 to 52, inclusive, and return a `{ delta: n }` where `n` is the difference between the given counter value and the counter position at which the token was found, or `undefined` if it was not found within the window. See the <a href="#totp․verifyDelta">`hotp․verifyDelta(options)`</a> documentation for more info.

```js
let token = speakeasy.hotp.verifyDelta({
	secret: secret.ascii,
	counter: 42,
	token: "123456",
	window: 10,
})
```

How this works:

```js
// Set ASCII secret
let secret = "rNONHRni6BAk7y2TiKrv"

// Get HOTP counter token at counter = 42
let counter42 = speakeasy.hotp({ secret: secret, counter: 42 })
// => '566646'

// Get HOTP counter token at counter = 45
let counter45 = speakeasy.hotp({ secret: secret, counter: 45 })
// => '323238'

// Verify the secret at counter 42 with the actual value and a window of 10
// This will check all counter values from 42 to 52, inclusive
speakeasy.hotp.verifyDelta({ secret: secret, counter: 42, token: counter42, window: 10 })
// => { delta: 0 } because the given token at counter 42 is 0 steps away from the given counter 42

// Verify the secret at counter 45, but give a counter of 42 and a window of 10
// This will check all counter values from 42 to 52, inclusive
speakeasy.hotp.verifyDelta({ secret: secret, counter: 42, token: counter45, window: 10 })
// => { delta: 3 } because the given token at counter 45 is 0 steps away from given counter 42

// Not in window: specify a window of 1, which only tests counters 42 and 43, not 45
speakeasy.hotp.verifyDelta({ secret: secret, counter: 42, token: counter45, window: 1 })
// => undefined

// Shortcut to use verify() to simply return whether it is verified as within the window
speakeasy.hotp.verify({ secret: secret, counter: 42, token: counter45, window: 10 })
// => true

// Not in window: specify a window of 1, which only tests counters 42 and 43, not 45
speakeasy.hotp.verify({ secret: secret, counter: 42, token: counter45, window: 1 })
// => false
```

Verify a TOTP token at the current time with a window of 2. Since the default time step is 30 seconds, and TOTP has a two-sided window, this will check tokens between [current time minus two tokens before] and [current time plus two tokens after]. In other words, with a time step of 30 seconds, it will check the token at the current time, plus the tokens at the current time minus 30 seconds, minus 60 seconds, plus 30 seconds, and plus 60 seconds – basically, it will check tokens between a minute ago and a minute from now. It will return a `{ delta: n }` where `n` is the difference between the current time step and the counter position at which the token was found, or `undefined` if it was not found within the window. See the <a href="#totp․verifyDelta">`totp․verifyDelta(options)`</a> documentation for more info.

```js
let verified = speakeasy.totp.verifyDelta({
	secret: secret.ascii,
	token: "123456",
	window: 2,
})
```

The mechanics of TOTP windows are the same as for HOTP, as shown above, just with two-sided windows, meaning that the `delta` value can be negative if the token is found before the given time or counter.

```js
let secret = "rNONHRni6BAk7y2TiKrv"

// By way of example, we will force TOTP to return tokens at time 1453853945 and
// at time 1453854005 (60 seconds ahead, or 2 steps ahead)
let token1 = speakeasy.totp({ secret: secret, time: 1453853945 }) // 625175
let token3 = speakeasy.totp({ secret: secret, time: 1453854005 }) // 222636
let token2 = speakeasy.totp({ secret: secret, time: 1453854065 }) // 013052

// We can check the time at token 3, 1453853975, with token 1, but use a window of 2
// With a time step of 30 seconds, this will check all tokens from 60 seconds
// before the time to 60 seconds after the time
speakeasy.totp.verifyDelta({ secret: secret, token: token1, window: 2, time: 1453854005 })
// => { delta: -2 }

// token is valid because because token is 60 seconds before time
speakeasy.totp.verify({ secret: secret, token: token1, window: 2, time: 1453854005 })
// => true

// token is valid because because token is 0 seconds before time
speakeasy.totp.verify({ secret: secret, token: token3, window: 2, time: 1453854005 })
// => true

// token is valid because because token is 60 seconds after time
speakeasy.totp.verify({ secret: secret, token: token2, window: 2, time: 1453854005 })
// => true

// This signifies that the given token, token1, is -2 steps away from
// the given time, which means that it is the token for the value at
// (-2 * time step) = (-2 * 30 seconds) = 60 seconds ago.
```

As shown previously, you can also change `verifyDelta()` to `verify()` to simply return a boolean if the given token is within the given window.

<a name="documentation"></a>

## Documentation

<dl>
<dt><a href="#digest">digest(options)</a> ⇒ <code>Buffer</code></dt>
<dd><p>Digest the one-time passcode options.</p>
</dd>
<dt><a href="#hotp">hotp(options)</a> ⇒ <code>String</code></dt>
<dd><p>Generate a counter-based one-time token.</p>
</dd>
<dt><a href="#hotp․verifyDelta">hotp․verifyDelta(options)</a> ⇒ <code>Object</code></dt>
<dd><p>Verify a counter-based one-time token against the secret and return the delta.</p>
</dd>
<dt><a href="#hotp․verify">hotp․verify(options)</a> ⇒ <code>Boolean</code></dt>
<dd><p>Verify a counter-based one-time token against the secret and return true if it
verifies.</p>
</dd>
<dt><a href="#totp">totp(options)</a> ⇒ <code>String</code></dt>
<dd><p>Generate a time-based one-time token.</p>
</dd>
<dt><a href="#totp․verifyDelta">totp․verifyDelta(options)</a> ⇒ <code>Object</code></dt>
<dd><p>Verify a time-based one-time token against the secret and return the delta.</p>
</dd>
<dt><a href="#totp․verify">totp․verify(options)</a> ⇒ <code>Boolean</code></dt>
<dd><p>Verify a time-based one-time token against the secret and return true if it
verifies.
</dd>
<dt><a href="#generateSecret">generateSecret(options)</a> ⇒ <code>Object</code> | <code><a href="#GeneratedSecret">GeneratedSecret</a></code></dt>
<dd><p>Generates a random secret with the set A-Z a-z 0-9 and symbols, of any length
(default 32).</p>
</dd>
<dt><a href="#generateSecretASCII">generateSecretASCII([length], [symbols])</a> ⇒ <code>String</code></dt>
<dd><p>Generates a key of a certain length (default 32) from A-Z, a-z, 0-9, and
symbols (if requested).</p>
</dd>
<dt><a href="#otpauthURL">otpauthURL(options)</a> ⇒ <code>String</code></dt>
<dd><p>Generate an URL for use with the Google Authenticator app.</p>
</dd>
</dl>

### Typedefs

<dl>
<dt><a href="#GeneratedSecret">GeneratedSecret</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="digest"></a>

### digest(options) ⇒ <code>Buffer</code>

Digest the one-time passcode options.

**Kind**: function

**Returns**: <code>Buffer</code> - The one-time passcode as a buffer.

| Param               | Type                 | Default                        | Description                                           |
| ------------------- | -------------------- | ------------------------------ | ----------------------------------------------------- |
| options             | <code>Object</code>  |                                |                                                       |
| options.secret      | <code>String</code>  |                                | Shared secret key                                     |
| options.counter     | <code>Integer</code> |                                | Counter value                                         |
| [options.encoding]  | <code>String</code>  | <code>&quot;ascii&quot;</code> | Key encoding (ascii, hex, base32, base64).            |
| [options.algorithm] | <code>String</code>  | <code>&quot;sha1&quot;</code>  | Hash algorithm (sha1, sha256, sha512).                |
| [options.key]       | <code>String</code>  |                                | (DEPRECATED. Use `secret` instead.) Shared secret key |

<a name="hotp"></a>

### hotp(options) ⇒ <code>String</code>

Generate a counter-based one-time token. Specify the key and counter, and
receive the one-time password for that counter position as a string. You can
also specify a token length, as well as the encoding (ASCII, hexadecimal, or
base32) and the hashing algorithm to use (SHA1, SHA256, SHA512).

**Kind**: function

**Returns**: <code>String</code> - The one-time passcode.

| Param               | Type                 | Default                        | Description                                                                         |
| ------------------- | -------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| options             | <code>Object</code>  |                                |                                                                                     |
| options.secret      | <code>String</code>  |                                | Shared secret key                                                                   |
| options.counter     | <code>Integer</code> |                                | Counter value                                                                       |
| [options.digest]    | <code>Buffer</code>  |                                | Digest, automatically generated by default                                          |
| [options.digits]    | <code>Integer</code> | <code>6</code>                 | The number of digits for the one-time passcode.                                     |
| [options.encoding]  | <code>String</code>  | <code>&quot;ascii&quot;</code> | Key encoding (ascii, hex, base32, base64).                                          |
| [options.algorithm] | <code>String</code>  | <code>&quot;sha1&quot;</code>  | Hash algorithm (sha1, sha256, sha512).                                              |
| [options.key]       | <code>String</code>  |                                | (DEPRECATED. Use `secret` instead.) Shared secret key                               |
| [options.length]    | <code>Integer</code> | <code>6</code>                 | (DEPRECATED. Use `digits` instead.) The number of digits for the one-time passcode. |

<a name="hotp․verifyDelta"></a>

### hotp․verifyDelta(options) ⇒ <code>Object</code>

Verify a counter-based one-time token against the secret and return the delta.
By default, it verifies the token at the given counter value, with no leeway
(no look-ahead or look-behind). A token validated at the current counter value
will have a delta of 0.

You can specify a window to add more leeway to the verification process.
Setting the window param will check for the token at the given counter value
as well as `window` tokens ahead (one-sided window). See param for more info.

`verifyDelta()` will return the delta between the counter value of the token
and the given counter value. For example, if given a counter 5 and a window
10, `verifyDelta()` will look at tokens from 5 to 15, inclusive. If it finds
it at counter position 7, it will return `{ delta: 2 }`.

**Kind**: function

**Returns**: <code>Object</code> - On success, returns an object with the counter
difference between the client and the server as the `delta` property (i.e.
`{ delta: 0 }`).

| Param               | Type                 | Default                        | Description                                                                                                                                                                                                                                       |
| ------------------- | -------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| options             | <code>Object</code>  |                                |                                                                                                                                                                                                                                                   |
| options.secret      | <code>String</code>  |                                | Shared secret key                                                                                                                                                                                                                                 |
| options.token       | <code>String</code>  |                                | Passcode to validate                                                                                                                                                                                                                              |
| options.counter     | <code>Integer</code> |                                | Counter value. This should be stored by the application and must be incremented for each request.                                                                                                                                                 |
| [options.digits]    | <code>Integer</code> | <code>6</code>                 | The number of digits for the one-time passcode.                                                                                                                                                                                                   |
| [options.window]    | <code>Integer</code> | <code>0</code>                 | The allowable margin for the counter. The function will check "W" codes in the future against the provided passcode, e.g. if W = 10, and C = 5, this function will check the passcode against all One Time Passcodes between 5 and 15, inclusive. |
| [options.encoding]  | <code>String</code>  | <code>&quot;ascii&quot;</code> | Key encoding (ascii, hex, base32, base64).                                                                                                                                                                                                        |
| [options.algorithm] | <code>String</code>  | <code>&quot;sha1&quot;</code>  | Hash algorithm (sha1, sha256, sha512).                                                                                                                                                                                                            |

<a name="hotp․verify"></a>

### hotp․verify(options) ⇒ <code>Boolean</code>

Verify a counter-based one-time token against the secret and return true if it
verifies. Helper function for `hotp.verifyDelta()`` that returns a boolean
instead of an object. For more on how to use a window with this, see
hotp.verifyDelta.

**Kind**: function

**Returns**: <code>Boolean</code> - Returns true if the token matches within the given
window, false otherwise.

| Param               | Type                 | Default                        | Description                                                                                                                                                                                                                                       |
| ------------------- | -------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| options             | <code>Object</code>  |                                |                                                                                                                                                                                                                                                   |
| options.secret      | <code>String</code>  |                                | Shared secret key                                                                                                                                                                                                                                 |
| options.token       | <code>String</code>  |                                | Passcode to validate                                                                                                                                                                                                                              |
| options.counter     | <code>Integer</code> |                                | Counter value. This should be stored by the application and must be incremented for each request.                                                                                                                                                 |
| [options.digits]    | <code>Integer</code> | <code>6</code>                 | The number of digits for the one-time passcode.                                                                                                                                                                                                   |
| [options.window]    | <code>Integer</code> | <code>0</code>                 | The allowable margin for the counter. The function will check "W" codes in the future against the provided passcode, e.g. if W = 10, and C = 5, this function will check the passcode against all One Time Passcodes between 5 and 15, inclusive. |
| [options.encoding]  | <code>String</code>  | <code>&quot;ascii&quot;</code> | Key encoding (ascii, hex, base32, base64).                                                                                                                                                                                                        |
| [options.algorithm] | <code>String</code>  | <code>&quot;sha1&quot;</code>  | Hash algorithm (sha1, sha256, sha512).                                                                                                                                                                                                            |

<a name="totp"></a>

### totp(options) ⇒ <code>String</code>

Generate a time-based one-time token. Specify the key, and receive the
one-time password for that time as a string. By default, it uses the current
time and a time step of 30 seconds, so there is a new token every 30 seconds.
You may override the time step and epoch for custom timing. You can also
specify a token length, as well as the encoding (ASCII, hexadecimal, or
base32) and the hashing algorithm to use (SHA1, SHA256, SHA512).

Under the hood, TOTP calculates the counter value by finding how many time
steps have passed since the epoch, and calls HOTP with that counter value.

**Kind**: function

**Returns**: <code>String</code> - The one-time passcode.

| Param                  | Type                 | Default                        | Description                                                                                                                                |
| ---------------------- | -------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| options                | <code>Object</code>  |                                |                                                                                                                                            |
| options.secret         | <code>String</code>  |                                | Shared secret key                                                                                                                          |
| [options.time]         | <code>Integer</code> |                                | Time in seconds with which to calculate counter value. Defaults to `Date.now()`.                                                           |
| [options.step]         | <code>Integer</code> | <code>30</code>                | Time step in seconds                                                                                                                       |
| [options.epoch]        | <code>Integer</code> | <code>0</code>                 | Initial time since the UNIX epoch from which to calculate the counter value. Defaults to 0 (no offset).                                    |
| [options.counter]      | <code>Integer</code> |                                | Counter value, calculated by default.                                                                                                      |
| [options.digits]       | <code>Integer</code> | <code>6</code>                 | The number of digits for the one-time passcode.                                                                                            |
| [options.encoding]     | <code>String</code>  | <code>&quot;ascii&quot;</code> | Key encoding (ascii, hex, base32, base64).                                                                                                 |
| [options.algorithm]    | <code>String</code>  | <code>&quot;sha1&quot;</code>  | Hash algorithm (sha1, sha256, sha512).                                                                                                     |
| [options.key]          | <code>String</code>  |                                | (DEPRECATED. Use `secret` instead.) Shared secret key                                                                                      |
| [options.initial_time] | <code>Integer</code> | <code>0</code>                 | (DEPRECATED. Use `epoch` instead.) Initial time since the UNIX epoch from which to calculate the counter value. Defaults to 0 (no offset). |
| [options.length]       | <code>Integer</code> | <code>6</code>                 | (DEPRECATED. Use `digits` instead.) The number of digits for the one-time passcode.                                                        |

<a name="totp․verifyDelta"></a>

### totp․verifyDelta(options) ⇒ <code>Object</code>

Verify a time-based one-time token against the secret and return the delta.
By default, it verifies the token at the current time window, with no leeway
(no look-ahead or look-behind). A token validated at the current time window
will have a delta of 0.

You can specify a window to add more leeway to the verification process.
Setting the window param will check for the token at the given counter value
as well as `window` tokens ahead and `window` tokens behind (two-sided
window). See param for more info.

`verifyDelta()` will return the delta between the counter value of the token
and the given counter value. For example, if given a time at counter 1000 and
a window of 5, `verifyDelta()` will look at tokens from 995 to 1005,
inclusive. In other words, if the time-step is 30 seconds, it will look at
tokens from 2.5 minutes ago to 2.5 minutes in the future, inclusive.
If it finds it at counter position 1002, it will return `{ delta: 2 }`.
If it finds it at counter position 997, it will return `{ delta: -3 }`.

**Kind**: function

**Returns**: <code>Object</code> - On success, returns an object with the time step
difference between the client and the server as the `delta` property (e.g.
`{ delta: 0 }`).

| Param               | Type                 | Default                        | Description                                                                                                                                                                                                                                                          |
| ------------------- | -------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| options             | <code>Object</code>  |                                |                                                                                                                                                                                                                                                                      |
| options.secret      | <code>String</code>  |                                | Shared secret key                                                                                                                                                                                                                                                    |
| options.token       | <code>String</code>  |                                | Passcode to validate                                                                                                                                                                                                                                                 |
| [options.time]      | <code>Integer</code> |                                | Time in seconds with which to calculate counter value. Defaults to `Date.now()`.                                                                                                                                                                                     |
| [options.step]      | <code>Integer</code> | <code>30</code>                | Time step in seconds                                                                                                                                                                                                                                                 |
| [options.epoch]     | <code>Integer</code> | <code>0</code>                 | Initial time since the UNIX epoch from which to calculate the counter value. Defaults to 0 (no offset).                                                                                                                                                              |
| [options.counter]   | <code>Integer</code> |                                | Counter value, calculated by default.                                                                                                                                                                                                                                |
| [options.digits]    | <code>Integer</code> | <code>6</code>                 | The number of digits for the one-time passcode.                                                                                                                                                                                                                      |
| [options.window]    | <code>Integer</code> | <code>0</code>                 | The allowable margin for the counter. The function will check "W" codes in the future and the past against the provided passcode, e.g. if W = 5, and C = 1000, this function will check the passcode against all One Time Passcodes between 995 and 1005, inclusive. |
| [options.encoding]  | <code>String</code>  | <code>&quot;ascii&quot;</code> | Key encoding (ascii, hex, base32, base64).                                                                                                                                                                                                                           |
| [options.algorithm] | <code>String</code>  | <code>&quot;sha1&quot;</code>  | Hash algorithm (sha1, sha256, sha512).                                                                                                                                                                                                                               |

<a name="totp․verify"></a>

### totp․verify(options) ⇒ <code>Boolean</code>

Verify a time-based one-time token against the secret and return true if it
verifies. Helper function for verifyDelta() that returns a boolean instead of
an object. For more on how to use a window with this, see totp.verifyDelta.

**Kind**: function

**Returns**: <code>Boolean</code> - Returns true if the token matches within the given
window, false otherwise.

| Param               | Type                 | Default                        | Description                                                                                                                                                                                                                                                          |
| ------------------- | -------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| options             | <code>Object</code>  |                                |                                                                                                                                                                                                                                                                      |
| options.secret      | <code>String</code>  |                                | Shared secret key                                                                                                                                                                                                                                                    |
| options.token       | <code>String</code>  |                                | Passcode to validate                                                                                                                                                                                                                                                 |
| [options.time]      | <code>Integer</code> |                                | Time in seconds with which to calculate counter value. Defaults to `Date.now()`.                                                                                                                                                                                     |
| [options.step]      | <code>Integer</code> | <code>30</code>                | Time step in seconds                                                                                                                                                                                                                                                 |
| [options.epoch]     | <code>Integer</code> | <code>0</code>                 | Initial time since the UNIX epoch from which to calculate the counter value. Defaults to 0 (no offset).                                                                                                                                                              |
| [options.counter]   | <code>Integer</code> |                                | Counter value, calculated by default.                                                                                                                                                                                                                                |
| [options.digits]    | <code>Integer</code> | <code>6</code>                 | The number of digits for the one-time passcode.                                                                                                                                                                                                                      |
| [options.window]    | <code>Integer</code> | <code>0</code>                 | The allowable margin for the counter. The function will check "W" codes in the future and the past against the provided passcode, e.g. if W = 5, and C = 1000, this function will check the passcode against all One Time Passcodes between 995 and 1005, inclusive. |
| [options.encoding]  | <code>String</code>  | <code>&quot;ascii&quot;</code> | Key encoding (ascii, hex, base32, base64).                                                                                                                                                                                                                           |
| [options.algorithm] | <code>String</code>  | <code>&quot;sha1&quot;</code>  | Hash algorithm (sha1, sha256, sha512).                                                                                                                                                                                                                               |

<a name="generateSecret"></a>

### generateSecret(options) ⇒ <code>Object</code> &#124; <code>[GeneratedSecret](#GeneratedSecret)</code>

Generates a random secret with the set A-Z a-z 0-9 and symbols, of any length
(default 32). Returns the secret key in ASCII, hexadecimal, and base32 format,
along with the URL used for the QR code for Google Authenticator (an otpauth
URL). Use a QR code library to generate a QR code based on the Google
Authenticator URL to obtain a QR code you can scan into the app.

**Kind**: function

**Returns**: A [`GeneratedSecret`](#GeneratedSecret) object

| Param                    | Type                 | Default            | Description                                                                                                                                                        |
| ------------------------ | -------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| options                  | <code>Object</code>  |                    |                                                                                                                                                                    |
| [options.length]         | <code>Integer</code> | <code>32</code>    | Length of the secret                                                                                                                                               |
| [options.symbols]        | <code>Boolean</code> | <code>false</code> | Whether to include symbols                                                                                                                                         |
| [options.otpauth_url]    | <code>Boolean</code> | <code>true</code>  | Whether to output a Google Authenticator-compatible otpauth:// URL (only returns otpauth:// URL, no QR code)                                                       |
| [options.name]           | <code>String</code>  |                    | The name to use with Google Authenticator.                                                                                                                         |
| [options.qr_codes]       | <code>Boolean</code> | <code>false</code> | (DEPRECATED. Do not use to prevent leaking of secret to a third party. Use your own QR code implementation.) Output QR code URLs for the token.                    |
| [options.google_auth_qr] | <code>Boolean</code> | <code>false</code> | (DEPRECATED. Do not use to prevent leaking of secret to a third party. Use your own QR code implementation.) Output a Google Authenticator otpauth:// QR code URL. |
| [options.issuer]         | <code>String</code>  |                    | The provider or service with which the secret key is associated.                                                                                                   |

<a name="generateSecretASCII"></a>

### generateSecretASCII([length], [symbols]) ⇒ <code>String</code>

Generates a key of a certain length (default 32) from A-Z, a-z, 0-9, and
symbols (if requested).

**Kind**: function

**Returns**: <code>String</code> - The generated key.

| Param     | Type                 | Default            | Description                            |
| --------- | -------------------- | ------------------ | -------------------------------------- |
| [length]  | <code>Integer</code> | <code>32</code>    | The length of the key.                 |
| [symbols] | <code>Boolean</code> | <code>false</code> | Whether to include symbols in the key. |

<a name="otpauthURL"></a>

### otpauthURL(options) ⇒ <code>String</code>

Generate a Google Authenticator-compatible otpauth:// URL for passing the
secret to a mobile device to install the secret.

Authenticator considers TOTP codes valid for 30 seconds. Additionally,
the app presents 6 digits codes to the user. According to the
documentation, the period and number of digits are currently ignored by
the app.

To generate a suitable QR Code, pass the generated URL to a QR Code
generator, such as the `qr-image` module.

**Kind**: function

**Throws**: Error if secret or label is missing, or if hotp is used and a
counter is missing, if the type is not one of `hotp` or `totp`, if the
number of digits is non-numeric, or an invalid period is used. Warns if
the number of digits is not either 6 or 8 (though 6 is the only one
supported by Google Authenticator), and if the hashihng algorithm is
not one of the supported SHA1, SHA256, or SHA512.

**Returns**: <code>String</code> - A URL suitable for use with the Google Authenticator.

**See**: https://github.com/google/google-authenticator/wiki/Key-Uri-Format

| Param               | Type                 | Default                       | Description                                                                                                    |
| ------------------- | -------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| options             | <code>Object</code>  |                               |                                                                                                                |
| options.secret      | <code>String</code>  |                               | Shared secret key                                                                                              |
| options.label       | <code>String</code>  |                               | Used to identify the account with which the secret key is associated, e.g. the user's email address.           |
| [options.type]      | <code>String</code>  | <code>&quot;totp&quot;</code> | Either "hotp" or "totp".                                                                                       |
| [options.counter]   | <code>Integer</code> |                               | The initial counter value, required for HOTP.                                                                  |
| [options.issuer]    | <code>String</code>  |                               | The provider or service with which the secret key is associated.                                               |
| [options.algorithm] | <code>String</code>  | <code>&quot;sha1&quot;</code> | Hash algorithm (sha1, sha256, sha512).                                                                         |
| [options.digits]    | <code>Integer</code> | <code>6</code>                | The number of digits for the one-time passcode. Currently ignored by Google Authenticator.                     |
| [options.period]    | <code>Integer</code> | <code>30</code>               | The length of time for which a TOTP code will be valid, in seconds. Currently ignored by Google Authenticator. |
| [options.encoding]  | <code>String</code>  | <code>ascii</code>            | Key encoding (ascii, hex, base32, base64). If the key is not encoded in Base-32, it will be reencoded.         |

<a name="GeneratedSecret"></a>

### GeneratedSecret : <code>Object</code>

**Kind**: global typedef

**Properties**

| Name           | Type                | Description                                             |
| -------------- | ------------------- | ------------------------------------------------------- |
| ascii          | <code>String</code> | ASCII representation of the secret                      |
| hex            | <code>String</code> | Hex representation of the secret                        |
| base32         | <code>String</code> | Base32 representation of the secret                     |
| qr_code_ascii  | <code>String</code> | URL for the QR code for the ASCII secret.               |
| qr_code_hex    | <code>String</code> | URL for the QR code for the hex secret.                 |
| qr_code_base32 | <code>String</code> | URL for the QR code for the base32 secret.              |
| google_auth_qr | <code>String</code> | URL for the Google Authenticator otpauth URL's QR code. |
| otpauth_url    | <code>String</code> | Google Authenticator-compatible otpauth URL.            |

<a name="contributing"></a>

## Contributing

We're very happy to have your contributions in Speakeasy.

**Contributing code** — Just run `npm run lint` to check everything and make sure to test your code! Next, make a pull request to this repo.

**Filing an issue** — Submit issues to the [GitHub Issues](https://github.com/levminer/speakeasy/issues) page.

## License

-   MIT
