#!/usr/bin/env node
import { createConsola } from "consola"
import { decodeUlid, getUlidBufferTime, makeUlid, toUlid } from "../default"
import { version } from "../../package.json"

const consola = createConsola({ stdout: process.stderr })
const options = new Map<string, string | undefined>
const commands: string[] = []

for (const argument of process.argv.slice(2)) {
	if (argument[0] == `-`) {
		const argumentEqualsIndex = argument.indexOf(`=`)
		let key
		let value

		if (argumentEqualsIndex == -1)
			key = argument
		else {
			key = argument.slice(0, argumentEqualsIndex)
			value = argument.slice(argumentEqualsIndex + 1)
		}

		if (argument[1] == `-`)
			options.set(key.slice(2), value)
		else {
			for (const option of key.slice(1))
				options.set(option, value)
		}
	} else {
		if (options.size) {
			consola.fatal(`Options must come last.`)
			process.exit(1)
		}

		commands.push(argument)
	}
}

consola.debug(commands)
consola.debug(options)

if (commands[0] == `version` || options.has(`version`)) {
	console.log(version)
	process.exit()
}

if (commands.length) {
	if (commands[0] == `get-time`) {
		if (commands.length < 2) {
			consola.fatal(`Missing argument.`)
			process.exit(1)
		}

		if (commands.length > 2) {
			consola.fatal(`Too many arguments.`)
			process.exit(1)
		}

		const ulidBuffer = decodeUlid(toUlid(commands[1]!))

		consola.debug(ulidBuffer)

		const time = getUlidBufferTime(ulidBuffer)

		let format

		if (options.has(`format`)) {
			format = options.get(`format`)
			options.delete(`format`)

			if (format == undefined) {
				consola.fatal(`Option --format requires value.`)
				process.exit(1)
			}
		}

		if (format == `locale` || format == undefined) {
			console.log(new Date(time).toLocaleString())
		} else if (format == `locale-full`) {
			console.log(new Date(time).toLocaleString(undefined, { dateStyle: `full`, timeStyle: `full` }))
		} else if (format == `iso`) {
			console.log(new Date(time).toISOString())
		} else if (format == `epoch-milliseconds`) {
			console.log(String(time))
		} else {
			consola.fatal(`Unrecognised format ${JSON.stringify(format)}.`)
			process.exit(1)
		}
	} else {
		consola.fatal(`Unknown command: ${commands[0]}`,)
	}
} else {
	console.log(makeUlid())
}

if (options.size) {
	consola.fatal(`Unknown option: --${options.keys().next().value}`)
	process.exit(1)
}

process.exit()
