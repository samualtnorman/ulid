import type { Brand, LaxPartial } from "@samual/types"

const CROCKFORD_BASE32 = `0123456789ABCDEFGHJKMNPQRSTVWXYZ`
const ULID_REGEX = /^[0-7][\dA-HJKMNP-TV-Z]{25}$/

/** A 16-byte `ArrayBuffer`. */
export type UlidBuffer = Brand<ArrayBuffer, { readonly UlidBuffer: unique symbol }[`UlidBuffer`]>

/** A valid [ULID](https://github.com/ulid/spec#readme) string. */
export type Ulid = Brand<string, { readonly Ulid: unique symbol }[`Ulid`]>

/** Check if the `ArrayBuffer`'s length is 16. */
export const isUlidBuffer =
	(arrayBuffer: ArrayBuffer): arrayBuffer is UlidBuffer => arrayBuffer.byteLength == 16

/** If the `ArrayBuffer` has a length of 16, it'll be returned as a `UlidBuffer`, otherwise throws. */
export const toUlidBuffer = (arrayBuffer: ArrayBuffer): UlidBuffer => {
	if (isUlidBuffer(arrayBuffer))
		return arrayBuffer

	throw Error(`ArrayBuffer's length was not 16`)
}

/** Check if the string is a `Ulid`. */
export const isUlid = (string: string): string is Ulid => ULID_REGEX.test(string)

/**
 * If the string is a valid [ULID](https://github.com/ulid/spec#readme), it'll be returned as a `Ulid`, otherwise
 * throws.
 */
export const toUlid = (string: string): Ulid => {
	if (isUlid(string))
		return string

	throw Error(`Invalid ULID.`)
}

/**
 * Make an empty 16-byte `ArrayBuffer`.
 *
 * This can be useful if you don't want to use `makeUlid()` or `makeUlidBuffer()` to for example use a custom random
 * function.
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
 * Set or update the time of a `UlidBuffer`.
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
 * Retrieve the time from a `UlidBuffer`.
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

export type MakeUlidBufferOptions = { ulidBuffer: UlidBuffer, time: number }

/**
 * Make a `UlidBuffer`.
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
export const makeUlidBuffer = (
	{ ulidBuffer = makeEmptyUlidBuffer(), time = Date.now() }: LaxPartial<MakeUlidBufferOptions> = {}
): UlidBuffer => {
	setUlidBufferTime(ulidBuffer, time)
	crypto.getRandomValues(new Uint8Array(ulidBuffer, 6))

	return ulidBuffer
}

/** Make a [ULID](https://github.com/ulid/spec#readme) string. */
export const makeUlid = (
	{ time = Date.now(), ulidBuffer = makeUlidBuffer({ time }) }: LaxPartial<MakeUlidBufferOptions> = {}
): Ulid => {
	const dataView = new DataView(ulidBuffer)
	let result = CROCKFORD_BASE32[dataView.getUint8(0) >> 5]!

	for (let bitOffset = 3; bitOffset < 123; bitOffset += 5) {
		const byteOffset = Math.floor(bitOffset / 8)

		result += CROCKFORD_BASE32[(dataView.getUint16(byteOffset) >> (11 - (bitOffset % 8))) & 0b1_1111]
	}

	return (result + CROCKFORD_BASE32[dataView.getUint8(15) & 0b1_1111]) as Ulid
}

/** Turn a ULID string back into an `ArrayBuffer`. */
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

export const incrementUlidBuffer = (ulidBuffer: UlidBuffer, { throwOnOverflow = false }: LaxPartial<{ throwOnOverflow: boolean }> = {}): void => {
	const dataView = new DataView(ulidBuffer)

	dataView.setBigUint64(8, dataView.getBigUint64(8) + 1n)

	if (!dataView.getBigUint64(8)) {
		dataView.setUint16(6, dataView.getUint16(6) + 1)

		if (throwOnOverflow && !dataView.getUint16(6))
			throw Error(`Overflow when incrementing ULID buffer`)
	}
}

export const cloneUlidBuffer = (ulidBuffer: UlidBuffer): UlidBuffer => ulidBuffer.slice() as UlidBuffer

export const makeMonotonicallyIncrementingUlidBufferFunction = (
	{ mitigateOverflow = true }: LaxPartial<{ mitigateOverflow: boolean }> = {}
): () => UlidBuffer => {
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
