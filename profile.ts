import { makeUlid } from "./src/default.ts"
import * as Monotonic from "./src/monotonic.ts"

declare const button: HTMLButtonElement
declare const monotonicButton: HTMLButtonElement

function start(makeUlid: () => string) {
	let result

	console.time()

	for (let count = 100_000_000; count--;)
		result = makeUlid()

	console.timeEnd()

	console.log(result)
}

if (typeof document == `object`) {
	button.onclick = () => start(makeUlid)
	monotonicButton.onclick = () => start(Monotonic.makeUlid)
} else
	start(process.env.MONOTONIC ? Monotonic.makeUlid : makeUlid)
