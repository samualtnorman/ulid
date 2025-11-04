import type { Brand, LaxPartial } from "@samual/types"

const Uint8Array_ = Uint8Array
const CROCKFORD_BASE32 = `0123456789ABCDEFGHJKMNPQRSTVWXYZ`
const ULID_REGEX = /^[0-7][\dA-HJKMNP-TV-Z]{25}$/

/** A 16-byte {@linkcode ArrayBuffer}. */
export type UlidBuffer = Brand<ArrayBuffer, { readonly UlidBuffer: unique symbol }[`UlidBuffer`]>

export type UlidBytes =
	Brand<Uint8Array<UlidBuffer>, { readonly UlidBytes: unique symbol }[`UlidBytes`]>

/** A valid [ULID](https://github.com/ulid/spec#readme) string. */
export type Ulid = Brand<string, { readonly Ulid: unique symbol }[`Ulid`]>

/** Check if the given {@linkcode ArrayBuffer}'s length is 16, if so narrow it to a {@linkcode UlidBuffer}. */
export const isUlidBuffer =
	(arrayBuffer: ArrayBuffer): arrayBuffer is UlidBuffer => arrayBuffer.byteLength == 16

/** If the {@linkcode ArrayBuffer} has a length of 16, it'll be returned as a {@linkcode UlidBuffer}, otherwise throws. */
export const toUlidBuffer = (arrayBuffer: ArrayBuffer): UlidBuffer => {
	if (isUlidBuffer(arrayBuffer))
		return arrayBuffer

	throw Error(`ArrayBuffer's length was not 16`)
}

export const isUlidBytes =
	(bytes: Uint8Array): bytes is UlidBytes => bytes.length == 16

export const toUlidBytes = (bytes: UlidBytes): UlidBytes => {
	if (isUlidBytes(bytes))
		return bytes

	throw Error(`Uint8Array's length was not 16`)
}

export const ulidBufferToBytes = (ulidBuffer: UlidBuffer): UlidBytes => new Uint8Array_(ulidBuffer) as UlidBytes

/** Check if the given string is a valid [ULID](https://github.com/ulid/spec#readme), if so narrow it to a {@linkcode Ulid}. */
export const isUlid = (string: string): string is Ulid => ULID_REGEX.test(string)

/** If the string is a valid [ULID](https://github.com/ulid/spec#readme), it'll be returned as a `Ulid`, otherwise throws. */
export const toUlid = (string: string): Ulid => {
	if (isUlid(string))
		return string

	throw Error(`Invalid ULID.`)
}

/**
 * Make an empty 16-byte {@linkcode ArrayBuffer} that's narrowed to a {@linkcode UlidBuffer}.
 *
 * This can be useful if you don't want to use {@linkcode makeUlid()} or {@linkcode makeUlidBuffer()} to for example use
 * a custom random function.
 * @example
 * ```js
 * const ulidBuffer = makeEmptyUlidBuffer()
 *
 * setUlidBufferTime(ulidBuffer, 1469922850259)
 *
 * const bytes = new Uint8Array(ulidBuffer)
 *
 * for (let index = 6; index < 16; index++)
 * 	bytes[index] = customRandomByteFunction()
 * ```
 */
export const makeEmptyUlidBuffer = (): UlidBuffer => new ArrayBuffer(16) as UlidBuffer

/**
 * Set or update the time of a {@linkcode UlidBuffer}.
 * @example
 * ```js
 * // Set to a specific time
 * setUlidBufferTime(ulidBuffer, 1469922850259)
 *
 * // Set to the current time
 * setUlidBufferTime(ulidBuffer)
 * ```
 */
export const setUlidBufferTime = (buffer: UlidBuffer, time: number = Date.now()): void => {
	const dataView = new DataView(buffer)

	dataView.setUint16(0, Math.floor(time / (2 ** (8 * 4))))
	dataView.setUint32(2, time)
}


export const setUlidBytesTime = (ulidBytes: UlidBytes, time = Date.now()): void => {
	ulidBytes[0] = time / (2 ** 40)
	ulidBytes[1] = time / (2 ** 32)
	ulidBytes[2] = time >> 24
	ulidBytes[3] = time >> 16
	ulidBytes[4] = time >> 8
	ulidBytes[5] = time
}

/**
 * Retrieve the time from a {@linkcode UlidBuffer}.
 * @example
 * ```js
 * const ulid = toUlid(`01ARZ3NDEKTSV4RRFFQ69G5FAV`)
 * const ulidBuffer = decodeUlid(ulid)
 * const time = getUlidBufferTime(ulidBuffer)
 * const date = new Date(time)
 *
 * console.log(date.toLocaleString()) // "31/07/2016, 00:54:10"
 * ```
 */
export const getUlidBufferTime = (buffer: UlidBuffer): number => {
	const dataView = new DataView(buffer)

	return (dataView.getUint16(0) * (2 ** (8 * 4))) + dataView.getUint32(2)
}

const POOL_BYTE_SIZE = 10 * 256
const pool = new Uint8Array_(POOL_BYTE_SIZE)
let poolOffset = 0

/**
 * Make a {@linkcode UlidBuffer}.
 *
 * This can be useful if you need it as an `ArrayBuffer` first, you can then stringify after.
 * @example
 * ```js
 * const ulidBuffer = makeUlidBuffer()
 *
 * database.user.create({ id: new Uint8Array(ulidBuffer), … })
 *
 * console.log(`Created user with id ${makeUlid({ buffer: ulidBuffer })}`)
 * ```
 */
export const makeUlidBuffer = ({ ulidBuffer = makeEmptyUlidBuffer(), time = Date.now() }: LaxPartial<{
	/** Reuse a previously used {@linkcode UlidBuffer}. Will be completely overwritten. @default makeEmptyUlidBuffer() */
	ulidBuffer: UlidBuffer

	/** The time in milliseconds that'll be written into the buffer. @default Date.now() */ time: number
}> = {}): UlidBuffer => {
	setUlidBufferTime(ulidBuffer, time)

	if (!poolOffset)
		crypto.getRandomValues(pool)

	new Uint8Array_(ulidBuffer, 6).set(pool.slice(poolOffset, poolOffset += 10))
	poolOffset %= POOL_BYTE_SIZE

	return ulidBuffer
}

export const setUlidBytesRandom = (ulidBytes: UlidBytes): void => {
	if (!(poolOffset %= POOL_BYTE_SIZE))
		crypto.getRandomValues(pool)

	ulidBytes.set(pool.subarray(poolOffset, poolOffset += 10), 6)
}

export const makeUlidBytes = (): UlidBytes => {
	const ulidBytes = makeEmptyUlidBytes()

	setUlidBytesTime(ulidBytes)
	setUlidBytesRandom(ulidBytes)

	return ulidBytes
}

export const timeToUlidString = (time: number) => {
	if (time > 0b1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111)
		throw Error(`ULID cannot represent a date more than 48 bits`)

	let result = ``

	for (let offset = 50; offset;)
		result += CROCKFORD_BASE32[(time / (2 ** (offset -= 5))) & 0b11111]

	return result
}

export const ulidBufferRandomPartToUlidString = (ulidBuffer: UlidBuffer) => {
	let result = ``
	const dataView = new DataView(ulidBuffer)

	for (let bitOffset = 48; bitOffset < 123; bitOffset += 5) {
		const byteOffset = Math.floor(bitOffset / 8)

		result += CROCKFORD_BASE32[(dataView.getUint16(byteOffset) >> (11 - (bitOffset % 8))) & 0b1_1111]
	}

	return (result + CROCKFORD_BASE32[dataView.getUint8(15) & 0b1_1111]) as Ulid
}

const persistedUlidStringBytes = new Uint8Array_(26)
const textDecoder = new TextDecoder()
const CROCKFORD_BASE32_CHAR_CODES = CROCKFORD_BASE32.split(``).map(char => char.charCodeAt(0))

export const ulidBufferToString = (ulidBuffer: UlidBuffer): Ulid => {
	const dataView = new DataView(ulidBuffer)

	persistedUlidStringBytes[0] = CROCKFORD_BASE32_CHAR_CODES[dataView.getUint8(0) >> 5]!

	for (let bitOffset = 3, index = 1; bitOffset < 123; bitOffset += 5)
		persistedUlidStringBytes[index++] = CROCKFORD_BASE32_CHAR_CODES[(dataView.getUint16(Math.floor(bitOffset / 8)) >> (11 - (bitOffset % 8))) & 0b1_1111]!

	persistedUlidStringBytes[25] = CROCKFORD_BASE32_CHAR_CODES[dataView.getUint8(15) & 0b1_1111]!

	return textDecoder.decode(persistedUlidStringBytes) as Ulid
}

export const makeEmptyUlidBytes = (): UlidBytes => new Uint8Array_(16) as UlidBytes

const MAKE_ULID_POOL_SIZE = 16 * 256
const makeUlidPool = new Uint8Array_(MAKE_ULID_POOL_SIZE)
let makeUlidPoolOffset = 0

/** Make a [ULID](https://github.com/ulid/spec#readme) string that's narrowed to a {@linkcode Ulid}. */
export const makeUlid = (): Ulid => {
	const time = Date.now()

	persistedUlidStringBytes[0] = CROCKFORD_BASE32_CHAR_CODES[(time / (2 ** 45)) & 0x1F]!
	persistedUlidStringBytes[1] = CROCKFORD_BASE32_CHAR_CODES[(time / (2 ** 40)) & 0x1F]!
	persistedUlidStringBytes[2] = CROCKFORD_BASE32_CHAR_CODES[(time / (2 ** 35)) & 0x1F]!
	persistedUlidStringBytes[3] = CROCKFORD_BASE32_CHAR_CODES[(time / (2 ** 30)) & 0x1F]!

	for (let index = 4, offset = 30; index < 10;)
		persistedUlidStringBytes[index++] = CROCKFORD_BASE32_CHAR_CODES[(time >> (offset -= 5)) & 0x1F]!

	if (!(makeUlidPoolOffset %= MAKE_ULID_POOL_SIZE))
		crypto.getRandomValues(makeUlidPool)

	persistedUlidStringBytes.set(makeUlidPool.subarray(makeUlidPoolOffset, makeUlidPoolOffset += 16), 10)

	for (let index = 10; index < 26;)
		persistedUlidStringBytes[index] = CROCKFORD_BASE32_CHAR_CODES[persistedUlidStringBytes[index++]! & 0x1F]!

	return textDecoder.decode(persistedUlidStringBytes) as Ulid
}

/** Turn a {@linkcode Ulid} back into an {@linkcode UlidBuffer}. */
export const decodeUlid = (ulid: Ulid): UlidBuffer => {
	const ulidBuffer = makeUlidBuffer()
	const bytes = new Uint8Array_(ulidBuffer)

	for (let bytesIndex = 0, ulidIndex = 0; bytesIndex < 15; bytesIndex++) {
		bytes[bytesIndex] = (CROCKFORD_BASE32.indexOf(ulid[ulidIndex]!) << 5) |
			CROCKFORD_BASE32.indexOf(ulid[++ulidIndex]!)

		bytes[++bytesIndex] = (CROCKFORD_BASE32.indexOf(ulid[++ulidIndex]!) << 3) |
			(CROCKFORD_BASE32.indexOf(ulid[++ulidIndex]!) >> 2)

		bytes[++bytesIndex] = (CROCKFORD_BASE32.indexOf(ulid[ulidIndex]!) << 6) |
			(CROCKFORD_BASE32.indexOf(ulid[++ulidIndex]!) << 1) | (CROCKFORD_BASE32.indexOf(ulid[++ulidIndex]!) >> 4)

		bytes[++bytesIndex] = (CROCKFORD_BASE32.indexOf(ulid[ulidIndex]!) << 4) |
			(CROCKFORD_BASE32.indexOf(ulid[++ulidIndex]!) >> 1)

		bytes[++bytesIndex] = (CROCKFORD_BASE32.indexOf(ulid[ulidIndex]!) << 7) |
			(CROCKFORD_BASE32.indexOf(ulid[++ulidIndex]!) << 2) | (CROCKFORD_BASE32.indexOf(ulid[++ulidIndex]!) >> 3)
	}

	bytes[15] = (CROCKFORD_BASE32.indexOf(ulid[24]!) << 5) | CROCKFORD_BASE32.indexOf(ulid[25]!)

	return ulidBuffer
}

/** Increment the random part of the given {@linkcode UlidBuffer} by 1. */
export const incrementUlidBuffer = (ulidBuffer: UlidBuffer, { throwOnOverflow = false }: LaxPartial<{ throwOnOverflow: boolean }> = {}): void => {
	const bytes = ulidBufferToBytes(ulidBuffer)

	for (let index = 16; index > 6; index--) {
		if (bytes[index] = bytes[index]! + 1)
			return
	}

	if (throwOnOverflow)
		throw Error(`Overflow when incrementing ULID buffer`)
}

/** Clone a {@linkcode UlidBuffer}. */
export const cloneUlidBuffer = (ulidBuffer: UlidBuffer): UlidBuffer => {
	const clone = makeEmptyUlidBytes()

	clone.set(new Uint8Array_(ulidBuffer))

	return clone.buffer
}

/**
 * Make a monotonically incrementing {@linkcode UlidBuffer} generation function. This means if you generate 2
 * `UlidBuffer`s using the returned function within the same millisecond, the next one'll simply be an incremented
 * version of the previous one.
 * @throws If you try to generate another `UlidBuffer` and the previous's random section bytes is all `0xFF`.
 * This is mitigated with `mitigateOverflow` which is on by default.
 */
export const makeMonotonicallyIncrementingUlidBufferFunction = ({ mitigateOverflow = true }: LaxPartial<{
	/**
	 * Mitigate the chance of overflow by setting the most significant bit to `0` after generating a new {UlidBuffer}
	 * (not when incrementing the previously generated `UlidBuffer`). This should in theory guarantee that you have at
	 * least 604 sextillion increments before you hit the overflow which I imagine is incredibly hard, especially in
	 * JavaScript.
	 */
	mitigateOverflow: boolean
}> = {}): (options?: LaxPartial<{ ulidBuffer: UlidBuffer }>) => UlidBuffer => {
	const stateUlidBuffer = makeEmptyUlidBuffer()
	const stateUlidBytes = new Uint8Array_(stateUlidBuffer)

	return ({ ulidBuffer } = {}) => {
		if (getUlidBufferTime(stateUlidBuffer) >= Date.now())
			incrementUlidBuffer(stateUlidBuffer, { throwOnOverflow: true })
		else {
			makeUlidBuffer({ ulidBuffer: stateUlidBuffer })

			if (mitigateOverflow)
				stateUlidBytes[6]! &= 0b0111_1111
		}

		if (!ulidBuffer)
			return cloneUlidBuffer(stateUlidBuffer)

		new Uint8Array_(ulidBuffer).set(stateUlidBytes)

		return ulidBuffer
	}
}

vitest: if (import.meta.vitest) {
	const { bench, describe } = import.meta.vitest

	if (process.env.MODE != `benchmark`)
		break vitest

	describe(`ULID generation`, async () => {
		bench(`tiny-ulid`, () => {
			makeUlid()
		})

		const toBenchmark = await Promise.all(Object.entries({
			"@sn/ulid@previous": import("@sn/ulid@previous").then(({ makeUlid }) => makeUlid),
			"ulid": import(`ulid`).then(({ ulid }) => ulid),
			"ulidx": import(`ulidx`).then(({ ulid }) => ulid),
			"wa-ulid": import(`wa-ulid`).then(async ({ default: init, ulid }) => (await init(), ulid)),
			"ulid-workers": import(`ulid-workers`).then(({ ulidFactory }) => ulidFactory({ monotonic: false })),
			"@ulid/ulid": import(`@ulid/ulid`).then(({ ulid }) => ulid),
			"@kiosked/ulid": import(`@kiosked/ulid`).then(({ ulid }) => ulid),
			"@evokegroup/ulid": import(`@evokegroup/ulid`).then(({ ulid }) => ulid),
			"ulid-generator": import(`ulid-generator`).then(({ ulid }) => ulid as () => string),
			"@std/ulid": import(`@std/ulid`).then(({ ulid }) => ulid),
			"@yi/ulid": import(`@yi/ulid`).then(({ generateULID }) => generateULID)
		} satisfies Record<string, Promise<() => string>>).map(async ([ name, promise ]): Promise<[ string, () => string ]> => [ name, await promise ]))

		for (const [ name, makeUlid ] of toBenchmark) {
			bench(name, () => {
				makeUlid()
			})
		}
	})

	describe(`ULID buffer incrementing`, async () => {
		const ulidBuffer = makeUlidBuffer()
		
		bench(`current`, () => {
			incrementUlidBuffer(ulidBuffer, { throwOnOverflow: true })
		})

		await import(`@sn/ulid@previous`).then(({ makeUlidBuffer, incrementUlidBuffer }) => {
			const ulidBuffer = makeUlidBuffer()
			
			bench(`@sn/ulid@previous`, () => {
				incrementUlidBuffer(ulidBuffer, { throwOnOverflow: true })
			})
		})
	})

	describe(`ULID buffer cloning`, async () => {
		const ulidBuffer = makeUlidBuffer()

		bench(`current`, () => {
			cloneUlidBuffer(ulidBuffer)
		})

		await import(`@sn/ulid@previous`).then(({ makeUlidBuffer, cloneUlidBuffer }) => {
			const ulidBuffer = makeUlidBuffer()

			bench(`@sn/ulid@previous`, () => {
				cloneUlidBuffer(ulidBuffer)
			})
		})
	})
}
