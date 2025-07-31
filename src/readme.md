# Tiny ULID
Make and decode [ULID](https://github.com/ulid/spec#readme)s as well as set and read ULID times.

## Examples
### Make a ULID
```js
import { makeUlid } from "{PACKAGE_NAME}"

const ulid = makeUlid()

console.log(ulid) // "01K1BB2NM2JQ01NCZRW8B8M894"
```

### Decode a ULID and read its date
```js
import { toUlid, decodeUlid, getUlidBufferTime } from "{PACKAGE_NAME}"

const ulid = toUlid("01ARZ3NDEKTSV4RRFFQ69G5FAV")
// Decode to a 16-byte ArrayBuffer
const ulidBuffer = decodeUlid(ulid)
const time = getUlidBufferTime(ulidBuffer)
const date = new Date(time)

console.log(date.toLocaleString()) // "31/07/2016, 00:54:10"
```

### Generate a ULID as an `ArrayBuffer` first then stringify it
```js
import { makeUlidBuffer, makeUlid } from "{PACKAGE_NAME}"

const ulidBuffer = makeUlidBuffer()

database.user.create({ id: new Uint8Array(ulidBuffer), /* … */ })

console.log(`Created user with id ${makeUlid({ buffer: ulidBuffer })}`) // "Created user with id 01K1BBWHP7PMEEAPCGPKW62CTM"
```

## Performance
This package is at the time of writing about 12x faster than [ulid](https://www.npmjs.com/package/ulid) and [ulidx](https://www.npmjs.com/package/ulidx).

|                    Package                   |  Time   |
|----------------------------------------------|---------|
| [ulid](https://www.npmjs.com/package/ulid)   | 23.266s |
| [ulidx](https://www.npmjs.com/package/ulidx) | 23.547s |
| **tiny-ulid**                                |  1.865s |

I got these numbers with this script:
```js
// Uncomment one of these
// import { ulid as makeUlid } from "ulid"
// import { ulid as makeUlid } from "ulidx"
// import { makeUlid } from "tiny-ulid"

// Trying to prevent the optimiser from optimising away the calls by making sure we do something with the generated ULID
let ulid

// Warm up the function
makeUlid()
makeUlid()
makeUlid()

console.time()

// One million calls
for (let i = 1_000_000; i--;)
	ulid = makeUlid()

console.timeEnd()
console.log(ulid)
```

I ran it 4 times, discarded the first result and averaged together the last 3. Bear in mind, these results are specific to my machine and will be different on yours.
These types of benchmarks are also never apples to apples. All 3 packages have different bells and whistles. This benchmark is only relevant to you if you only care about fast ULID string generation and nothing else.

## Bundle Size
This package is at the time of writing the smallest way to generate ULIDs (in JavaScript).

|                    Package                   | Treeshaken |  Minified  |  Gzipped   |
|----------------------------------------------|------------|------------|------------|
| [ulid](https://www.npmjs.com/package/ulid)   | 4423 bytes | 1702 bytes |  874 bytes |
| [ulidx](https://www.npmjs.com/package/ulidx) | 6975 bytes | 2762 bytes | 1264 bytes |
| **tiny-ulid**                                | 1059 bytes |  488 bytes |  354 bytes |

I got these numbers with this [Rollup](https://rollupjs.org/) config and input:

```js
import { nodeResolve } from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"

export default {
	input: `main.js`,
	output: { dir: `dist` },
	plugins: [
		nodeResolve(),
		// Uncomment to test minifying
		// terser({ compress: { passes: Infinity }, ecma: 2020 })
	]
}
```

```js
// Uncomment one of these
// import { ulid as makeUlid } from "ulid"
// import { ulid as makeUlid } from "ulidx"
// import { makeUlid } from "tiny-ulid"

console.log(makeUlid())
```
