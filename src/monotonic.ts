import { makeMonotonicallyIncrementingUlidBufferFunction, makeUlid as makeUlid_, type Ulid, type UlidBuffer } from "./default.ts"

export const makeUlidBuffer: () => UlidBuffer = makeMonotonicallyIncrementingUlidBufferFunction()
export const makeUlid = (): Ulid => makeUlid_({ ulidBuffer: makeUlidBuffer() })
