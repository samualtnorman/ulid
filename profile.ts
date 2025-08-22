import { makeUlid } from "./src/default.ts"

declare const button: HTMLButtonElement

function start() {
	let result

	console.time()

	for (let count = 10_000_000; count--;)
		result = makeUlid()

	console.timeEnd()

	console.log(result)
}

if (typeof button == `object`)
	button.onclick = start
else
	start()
