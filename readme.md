# Tulid
Make and decode [ULID](https://github.com/ulid/spec#readme)s as well as set and read ULID times.

## Make a ULID
```js
import { makeUlid } from "tulid"

const ulid = makeUlid()

console.log(ulid) // "01K1BB2NM2JQ01NCZRW8B8M894"
```

## Decode a ULID and read its date
```js
import { toUlid, decodeUlid, getUlidBufferTime } from "tulid"

const ulid = toUlid("01ARZ3NDEKTSV4RRFFQ69G5FAV")
// Decode to a 16-byte ArrayBuffer
const ulidBuffer = decodeUlid(ulid)
const time = getUlidBufferTime(ulidBuffer)
const date = new Date(time)

console.log(date.toLocaleString()) // "31/07/2016, 00:54:10"
```

## Generate a ULID as an `ArrayBuffer` first then stringify it
```js
import { makeUlidBuffer, makeUlid } from "tulid"

const ulidBuffer = makeUlidBuffer()

database.user.create({ id: new Uint8Array(ulidBuffer), /* … */ })

console.log(`Created user with id ${makeUlid({ buffer: ulidBuffer })}`) // "Created user with id 01K1BBWHP7PMEEAPCGPKW62CTM"
```
