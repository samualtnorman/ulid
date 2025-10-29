import { makeMonotonicallyIncrementingUlidBufferFunction, type Ulid, type UlidBuffer } from "./default.ts"

/**
 * A shared function used for generating monotonically incrementing {@linkcode UlidBuffer}s.
 * Note that if another package or module also imports and uses this function, your monotonically incremented
 * `UlidBuffer` may appear to "skip" if they call this function in between your code calling this function. If that's
 * fine with you, feel free to use this function out of convenience.
 */
export const makeUlidBuffer = makeMonotonicallyIncrementingUlidBufferFunction()

let stateTime = 0
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

		stateUlidStringBytes[10] = CROCKFORD_BASE32_CHAR_CODES[stateUlidStringBytes[10]! & 0xF]!

		for (let index = 11; index < 26;)
			stateUlidStringBytes[index] = CROCKFORD_BASE32_CHAR_CODES[stateUlidStringBytes[index++]! & 0x1F]!
	} else {
		for (let index = 25; index > 9; index--) {
			const value = (CROCKFORD_BASE32_CHAR_CODES.indexOf(stateUlidStringBytes[index]!) + 1) & 0x1F

			stateUlidStringBytes[index] = CROCKFORD_BASE32_CHAR_CODES[value]!

			if (value)
				break if_
		}

		throw Error(`Overflow when incrementing ULID`)
	}

	return textDecoder.decode(stateUlidStringBytes) as Ulid
}

vitest: if (import.meta.vitest) {
	const { bench } = import.meta.vitest

	if (process.env.MODE != `benchmark`)
		break vitest

	bench(`tiny-ulid`, () => {
		makeUlid()
	})

	const toBenchmark = await Promise.all(Object.entries({
		"@sn/ulid@0.1.2-a2f5883": import("@sn/ulid@0.1.2-a2f5883/monotonic").then(({ makeUlid }) => makeUlid),
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
