import { makeMonotonicallyIncrementingUlidBufferFunction, makeUlid as makeUlid_, type Ulid, type UlidBuffer } from "./default"

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
