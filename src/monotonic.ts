import { cloneUlidBuffer, incrementUlidBuffer, makeEmptyUlidBuffer, makeUlidBuffer as makeUlidBufferOriginal, setUlidBufferTime, type Ulid, type UlidBuffer } from "./default"

let lastGeneratedBuffer = false
let stateTime = 0
const stateUlidBuffer = makeEmptyUlidBuffer()
const stateUlidBytes = new Uint8Array(stateUlidBuffer)

/**
 * A shared function used for generating monotonically incrementing {@linkcode UlidBuffer}s.
 * Note that if another package or module also imports and uses this function, your monotonically incremented
 * `UlidBuffer` may appear to "skip" if they call this function in between your code calling this function. If that's
 * fine with you, feel free to use this function out of convenience.
 */
export const makeUlidBuffer = (): UlidBuffer => {
	const time = Date.now()

	if (stateTime < time) {
		stateTime = time
		makeUlidBufferOriginal({ ulidBuffer: stateUlidBuffer })
		stateUlidBytes[6]! &= 0b0111_1111
	} else {
		if (!lastGeneratedBuffer) {
			setUlidBufferTime(stateUlidBuffer, stateTime)

			for (let bytesIndex = 0, ulidIndex = 0; bytesIndex < 15; bytesIndex++) {
				stateUlidBytes[bytesIndex] = (CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[ulidIndex]!) << 5) |
					CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[++ulidIndex]!)

				stateUlidBytes[++bytesIndex] = (CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[++ulidIndex]!) << 3) |
					(CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[++ulidIndex]!) >> 2)

				stateUlidBytes[++bytesIndex] = (CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[ulidIndex]!) << 6) |
					(CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[++ulidIndex]!) << 1) | (CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[++ulidIndex]!) >> 4)

				stateUlidBytes[++bytesIndex] = (CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[ulidIndex]!) << 4) |
					(CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[++ulidIndex]!) >> 1)

				stateUlidBytes[++bytesIndex] = (CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[ulidIndex]!) << 7) |
					(CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[++ulidIndex]!) << 2) | (CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[++ulidIndex]!) >> 3)
			}

			stateUlidBytes[15] = (CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[24]!) << 5) | CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[25]!)
		}

		incrementUlidBuffer(stateUlidBuffer, { throwOnOverflow: true })
	}

	lastGeneratedBuffer = true

	return cloneUlidBuffer(stateUlidBuffer)
}

const stateUlidStringBytes = new Uint8Array(26)
const textDecoder = new TextDecoder()

const CROCKFORD_BASE32_CHAR_CODES = new Uint8Array([
	48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 69, 70,
	71, 72, 74, 75, 77, 78, 80, 81, 82, 83, 84, 86, 87, 88, 89, 90
])

/**
 * A shared function used for generating monotonically incrementing {@linkcode Ulid}s.
 * Note that if another package or module also imports and uses this function, your monotonically incremented
 * `Ulid` may appear to "skip" if they call this function in between your code calling this function. If that's
 * fine with you, feel free to use this function out of convenience.
 */
export const makeUlid = (): Ulid => {
	const time = Date.now()

	if_: if (stateTime < time) {
		stateTime = time

		for (let offset = 50, index = 0; offset;)
			stateUlidStringBytes[index++] = CROCKFORD_BASE32_CHAR_CODES[(time / (2 ** (offset -= 5))) & 0x1F]!

		crypto.getRandomValues(new Uint8Array(stateUlidStringBytes.buffer, 10))

		// Overflow mitigation
		stateUlidStringBytes[10] = CROCKFORD_BASE32_CHAR_CODES[stateUlidStringBytes[10]! & 0xF]!

		for (let index = 11; index < 26;)
			stateUlidStringBytes[index] = CROCKFORD_BASE32_CHAR_CODES[stateUlidStringBytes[index++]! & 0x1F]!
	} else {
		if (lastGeneratedBuffer) {
			const dataView = new DataView(stateUlidBuffer)
			stateUlidStringBytes[0] = CROCKFORD_BASE32_CHAR_CODES[dataView.getUint8(0) >> 5]!

			for (let bitOffset = 3, index = 1; bitOffset < 123; bitOffset += 5, index++) {
				const byteOffset = Math.floor(bitOffset / 8)

				stateUlidStringBytes[index] = CROCKFORD_BASE32_CHAR_CODES[(dataView.getUint16(byteOffset) >> (11 - (bitOffset % 8))) & 0b1_1111]!
			}

			stateUlidStringBytes[25] = CROCKFORD_BASE32_CHAR_CODES[dataView.getUint8(15) & 0b1_1111]!
		}
		
		for (let index = 25; index > 9; index--) {
			const value = (CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[index]!) + 1) & 0x1F

			stateUlidStringBytes[index] = CROCKFORD_BASE32_CHAR_CODES[value]!

			if (value)
				break if_
		}

		throw Error(`Overflow when incrementing ULID`)
	}

	lastGeneratedBuffer = false

	return textDecoder.decode(stateUlidStringBytes) as Ulid
}

vitest: if (import.meta.vitest) {
	const { bench, describe, beforeEach, afterEach, vi, test, expect } = import.meta.vitest

	describe(`makeUlidBuffer() and makeUlid() carry on from where each other left off`, () => {
		beforeEach(() => {
			vi.useFakeTimers()
			crypto.getRandomValues = value => value
		})

		afterEach(() => {
			vi.useRealTimers()
		})

		test(`makeUlid() to makeUlidBuffer()`, () => {
			vi.setSystemTime(1761666627953)

			expect(makeUlid()).toMatchInlineSnapshot(`"01K8NR6YBH0000000000000000"`)

			expect(makeUlid()).toMatchInlineSnapshot(`"01K8NR6YBH0000000000000001"`)

			expect(makeUlidBuffer()).toMatchInlineSnapshot(`
				ArrayBuffer [
				  1,
				  -102,
				  43,
				  -125,
				  121,
				  113,
				  0,
				  0,
				  0,
				  0,
				  0,
				  0,
				  0,
				  0,
				  0,
				  2,
				]
			`)

			expect(makeUlidBuffer()).toMatchInlineSnapshot(`
				ArrayBuffer [
				  1,
				  -102,
				  43,
				  -125,
				  121,
				  113,
				  0,
				  0,
				  0,
				  0,
				  0,
				  0,
				  0,
				  0,
				  0,
				  3,
				]
			`)

			expect(makeUlid()).toMatchInlineSnapshot(`"01K8NR6YBH0000000000000004"`)
		})
	})


	if (process.env.MODE != `benchmark`)
		break vitest

	bench(`tiny-ulid`, () => {
		makeUlid()
	})

	const toBenchmark = await Promise.all(Object.entries({
		"@sn/ulid@previous": import("@sn/ulid@previous/monotonic").then(({ makeUlid }) => makeUlid),
		"ulid": import(`ulid`).then(({ monotonicFactory }) => monotonicFactory()),
		"ulidx": import(`ulidx`).then(({ monotonicFactory }) => monotonicFactory()),
		"wa-ulid": import(`wa-ulid`).then(async ({ default: init, monotonicFactory }) => (await init(), monotonicFactory())),
		"ulid-workers": import(`ulid-workers`).then(({ ulidFactory }) => ulidFactory({ monotonic: true })),
		"@kiosked/ulid": import(`@kiosked/ulid`).then(({ monotonicFactory }) => monotonicFactory()),
		"ulid-generator": import(`ulid-generator`).then(({ ulid }) => ulid.bind(undefined, { monotonic: true }) as () => string),
		"@std/ulid": import(`@std/ulid`).then(({ monotonicUlid }) => monotonicUlid)
	} satisfies Record<string, Promise<() => string>>).map(async ([ name, promise ]): Promise<[ string, () => string ]> => [ name, await promise ]))

	for (const [ name, makeUlid ] of toBenchmark) {
		bench(name, () => {
			makeUlid()
		})
	}
}
