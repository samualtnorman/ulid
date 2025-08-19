import type { Brand, LaxPartial } from "@samual/types"

const CROCKFORD_BASE32 = `0123456789ABCDEFGHJKMNPQRSTVWXYZ`
const ULID_REGEX = /^[0-7][\dA-HJKMNP-TV-Z]{25}$/

/** A 16-byte {@linkcode ArrayBuffer}. */
export type UlidBuffer = Brand<ArrayBuffer, { readonly UlidBuffer: unique symbol }[`UlidBuffer`]>

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
	crypto.getRandomValues(new Uint8Array(ulidBuffer, 6))

	return ulidBuffer
}

/** Make a [ULID](https://github.com/ulid/spec#readme) string that's narrowed to a {@linkcode Ulid}. */
export const makeUlid = ({ time = Date.now(), ulidBuffer = makeUlidBuffer({ time }) }: LaxPartial<{
	/** The {@linkcode UlidBuffer} to turn into a {@linkcode Ulid}. @default makeUlidBuffer() */ ulidBuffer: UlidBuffer

	/**
	 * The time in milliseconds used when creating the default {@linkcode UlidBuffer} if you didn't pass in your own.
	 *
	 * This will have no affect if you passed in your own {@linkcode UlidBuffer}.
	 * @default Date.now()
	 */
	time: number
}> = {}): Ulid => {
	const dataView = new DataView(ulidBuffer)
	let result = CROCKFORD_BASE32[dataView.getUint8(0) >> 5]!

	for (let bitOffset = 3; bitOffset < 123; bitOffset += 5) {
		const byteOffset = Math.floor(bitOffset / 8)

		result += CROCKFORD_BASE32[(dataView.getUint16(byteOffset) >> (11 - (bitOffset % 8))) & 0b1_1111]
	}

	return (result + CROCKFORD_BASE32[dataView.getUint8(15) & 0b1_1111]) as Ulid
}

/** Turn a {@linkcode Ulid} back into an {@linkcode UlidBuffer}. */
export const decodeUlid = (ulid: Ulid): UlidBuffer => {
	const ulidBuffer = makeUlidBuffer()
	const bytes = new Uint8Array(ulidBuffer)

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
	const dataView = new DataView(ulidBuffer)

	dataView.setBigUint64(8, dataView.getBigUint64(8) + 1n)

	if (!dataView.getBigUint64(8)) {
		dataView.setUint16(6, dataView.getUint16(6) + 1)

		if (throwOnOverflow && !dataView.getUint16(6))
			throw Error(`Overflow when incrementing ULID buffer`)
	}
}

/** @returns A clone of the given {@linkcode UlidBuffer}. */
export const cloneUlidBuffer = (ulidBuffer: UlidBuffer): UlidBuffer => ulidBuffer.slice() as UlidBuffer

/**
 * @returns A function that generates monotonically incrementing {@linkcode UlidBuffer}s. This means if you generate 2
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
}> = {}): () => UlidBuffer => {
	let ulidBuffer: UlidBuffer

	return () => {
		if (ulidBuffer && getUlidBufferTime(ulidBuffer) >= Date.now()) {
			incrementUlidBuffer(ulidBuffer, { throwOnOverflow: true })

			return cloneUlidBuffer(ulidBuffer)
		}

		ulidBuffer = makeUlidBuffer()
		setUlidBufferTime(ulidBuffer)

		if (mitigateOverflow)
			(new Uint8Array(ulidBuffer))[6]! &= 0b0111_1111

		return cloneUlidBuffer(ulidBuffer)
	}
}
