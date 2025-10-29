# Tiny ULID
Make and decode [ULID](https://github.com/ulid/spec#readme)s as well as set and read ULID times.

[Read the docs!](https://jsr.io/@sn/ulid/doc)

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

console.log(`Created user with id ${makeUlid({ ulidBuffer: ulidBuffer })}`) // "Created user with id 01K1BBWHP7PMEEAPCGPKW62CTM"
```

## Performance
This package is at the time of writing the fastest way to generate ULIDs and about 61x faster than the
[official ulid package](https://www.npmjs.com/package/ulid).

```
1.26x faster than @yi/ulid
1.28x faster than @kiosked/ulid
1.74x faster than wa-ulid
4.79x faster than @std/ulid
6.82x faster than ulid-generator
12.11x faster than @ulid/ulid
19.07x faster than @evokegroup/ulid
60.78x faster than ulidx
61.97x faster than ulid
64.16x faster than ulid-workers
```

<details>
<summary>Details</summary>
<pre><code>
name                        hz     min      max    mean     p75     p99    p995    p999      rme  samples
tiny-ulid         2,577,373.38  0.0003   0.6821  0.0004  0.0004  0.0008  0.0014  0.0030   ±0.50%  1288687
ulid                 41,593.96  0.0175  14.1989  0.0240  0.0192  0.0357  0.0379  0.0683  ±14.60%    20797
ulidx                42,403.94  0.0172  14.9321  0.0236  0.0189  0.0362  0.0380  0.0521  ±14.43%    21202
wa-ulid           1,484,659.94  0.0004   0.5178  0.0007  0.0009  0.0010  0.0017  0.0035   ±0.32%   742331
ulid-workers         40,168.52  0.0175  16.0449  0.0249  0.0196  0.0255  0.0305  0.0357  ±15.94%    20085
@ulid/ulid          212,777.65  0.0035   1.7778  0.0047  0.0045  0.0062  0.0071  0.0140   ±2.68%   106389
@kiosked/ulid     2,020,010.70  0.0004   0.2188  0.0005  0.0005  0.0008  0.0008  0.0013   ±0.39%  1010006
@evokegroup/ulid    135,161.12  0.0065   1.0910  0.0074  0.0072  0.0098  0.0116  0.0187   ±1.76%    67581
ulid-generator      377,932.71  0.0021   2.5506  0.0026  0.0024  0.0030  0.0044  0.0067   ±4.48%   188967
@std/ulid           537,650.20  0.0015   3.8004  0.0019  0.0017  0.0029  0.0035  0.0052   ±5.82%   269365
@yi/ulid          2,042,408.77  0.0004   6.9220  0.0005  0.0005  0.0008  0.0009  0.0013   ±2.73%  1021205
</code></pre>
</details>


### Monotonic Generation
This package is at the time writing the fastest way to generate monotonically incrementing ULIDs and about 2.7x faster
than the official package.

```
1.10x faster than ulid-generator
1.87x faster than @kiosked/ulid
1.92x faster than @std/ulid
2.05x faster than ulidx
2.08x faster than wa-ulid
2.28x faster than ulid-workers
2.73x faster than ulid
```

<details>
<summary>Details</summary>
<pre><code>
name                        hz     min     max    mean     p75     p99    p995    p999     rme  samples
tiny-ulid         5,927,058.21  0.0001  1.6997  0.0002  0.0002  0.0003  0.0003  0.0006  ±0.68%  2963530
ulid              2,174,425.76  0.0003  0.2634  0.0005  0.0005  0.0006  0.0006  0.0032  ±0.48%  1087213
ulidx             2,893,800.30  0.0003  0.3107  0.0003  0.0003  0.0005  0.0006  0.0015  ±0.44%  1446901
wa-ulid           2,847,165.90  0.0003  0.2721  0.0004  0.0004  0.0005  0.0006  0.0010  ±0.39%  1423583
ulid-workers      2,603,224.62  0.0003  0.2014  0.0004  0.0004  0.0005  0.0006  0.0026  ±0.41%  1301613
@kiosked/ulid     3,164,119.08  0.0003  0.2095  0.0003  0.0003  0.0004  0.0005  0.0011  ±0.27%  1582060
ulid-generator    5,370,603.62  0.0002  0.1349  0.0002  0.0002  0.0002  0.0002  0.0005  ±0.15%  2685302
@std/ulid         3,091,482.32  0.0003  0.3658  0.0003  0.0003  0.0004  0.0005  0.0013  ±0.34%  1545742
</code></pre>
</details>

You can test these numbers for yourself by running `pnpm vitest bench --run`.

## Bundle Size
This package is at the time of writing the third smallest way to generate ULIDs (in JavaScript).

|                               Package                              |   Treeshaken  |   Minified   |    Gzipped   |
|--------------------------------------------------------------------|---------------|--------------|--------------|
| **Tiny ULID**                                                      |   1,221 bytes |    587 bytes |    394 bytes |
| [ulid](https://www.npmjs.com/package/ulid)                         |   4,338 bytes |  1,702 bytes |    874 bytes |
| [ulidx](https://www.npmjs.com/package/ulidx)                       |   6,891 bytes |  2,762 bytes |  1,264 bytes |
| [wa-ulid](https://www.npmjs.com/package/wa-ulid)                   | 102,495 bytes | 96,346 bytes | 43,129 bytes |
| [ulid-workers](https://www.npmjs.com/package/ulid-workers)         |   7,017 bytes |  2,535 bytes |  1,165 bytes |
| [@ulid/ulid](https://www.npmjs.com/package/@ulid/ulid)             |   1,327 bytes |  1,258 bytes |    649 bytes |
| [@kiosked/ulid](https://www.npmjs.com/package/@kiosked/ulid)       |   4,691 bytes |  1,932 bytes |  1,016 bytes |
| [@evokegroup/ulid](https://www.npmjs.com/package/@evokegroup/ulid) |   7,079 bytes |  3,077 bytes |  1,366 bytes |
| [ulid-generator](https://www.npmjs.com/package/ulid-generator)     |  12,512 bytes |  3,792 bytes |  1,488 bytes |
| [@std/ulid](https://jsr.io/@std/ulid)                              |   2,332 bytes |    411 bytes |    335 bytes |
| [@yi/ulid](https://jsr.io/@yi/ulid)                                |   1,614 bytes |    265 bytes |    231 bytes |
 
I got these numbers with this [Rollup](https://rollupjs.org/) config:

```js
import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import terser from "@rollup/plugin-terser"

export default {
	input: `main.js`,
	output: { dir: `dist` },
	plugins: [
		nodeResolve(),
		commonjs(),
		// Uncomment to test minifying
		// terser({ compress: { passes: Infinity }, ecma: 2020 })
	]
}

```

The "Treeshaken" column represents using just Rollup's built in tree shaking.
The "Minified" column represents using Rollup's built in tree shaking plus [Terser](https://terser.org/)'s minification.
The "Gzipped" column represents using the default [Gzip](https://en.wikipedia.org/wiki/Gzip) level (6) on the output produced from the "Minified" column.
Like I say above, these types of benchmarks are never apples to apples due to different packages having different features to each other.
These numbers are only relevant to you if you only care about the smallest ULID string generation and nothing else.
