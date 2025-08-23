import { makeMonotonicallyIncrementingUlidBufferFunction, makeUlid as makeUlid_, type Ulid, type UlidBuffer } from "./default.ts"

/**
 * A shared function used for generating monotonically incrementing {@linkcode UlidBuffer}s.
 * Note that if another package or module also imports and uses this function, your monotonically incremented
 * `UlidBuffer` may appear to "skip" if they call this function in between your code calling this function. If that's
 * fine with you, feel free to use this function out of convenience.
 */
export const makeUlidBuffer: () => UlidBuffer = makeMonotonicallyIncrementingUlidBufferFunction()

/**
 * A shared function used for generating monotonically incrementing {@linkcode Ulid}s.
 * Note that if another package or module also imports and uses this function, your monotonically incremented
 * `Ulid` may appear to "skip" if they call this function in between your code calling this function. If that's
 * fine with you, feel free to use this function out of convenience.
 */
export const makeUlid = (): Ulid => makeUlid_({ ulidBuffer: makeUlidBuffer() })

vitest: if (import.meta.vitest) {
	const { bench } = import.meta.vitest

	if (process.env.MODE != `benchmark`)
		break vitest

	bench(`tiny-ulid`, () => {
		makeUlid()
	})

	const toBenchmark = await Promise.all(Object.entries({
		"ulid": import(`ulid`).then(({ monotonicFactory }) => monotonicFactory()),
		"ulidx": import(`ulidx`).then(({ monotonicFactory }) => monotonicFactory()),
		"wa-ulid": import(`wa-ulid`).then(async ({ default: init, monotonicFactory }) => (await init(), monotonicFactory())),
		"ulid-workers": import(`ulid-workers`).then(({ ulidFactory }) => ulidFactory({ monotonic: true })),
		"@kiosked/ulid": import(`@kiosked/ulid`).then(({ monotonicFactory }) => monotonicFactory()),
		"ulid-generator": import(`ulid-generator`).then(({ ulid }) => ulid.bind(undefined, { monotonic: true }) as () => string),
		"@std/ulid": import(`@std/ulid`).then(({ monotonicUlid }) => monotonicUlid),
	} satisfies Record<string, Promise<() => string>>).map(async ([ name, promise ]): Promise<[ string, () => string ]> => [ name, await promise ]))

	for (const [ name, makeUlid ] of toBenchmark) {
		bench(name, () => {
			makeUlid()
		})
	}
}
