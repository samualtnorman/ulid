#!/usr/bin/env node
import type { LaxPartial } from "@samual/types"
import { createConsola } from "consola"
import { version } from "../../package.json"
import { decodeUlid, getUlidBufferTime, isUlid, makeUlid, toUlidBuffer } from "../default"

const consola = createConsola({ stdout: process.stderr })

try {
	const options = new Map<string, string | undefined>
	const commands: string[] = []

	function fatal(message: string): never {
		consola.fatal(message)
		process.exit(1)
	}

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

			if (argument[1] == `-`) {
				const name = key.slice(2)

				if (options.has(name))
					fatal(`Option --${name} specified twice.`)

				options.set(name, value)
			} else {
				for (const name of key.slice(1)) {
					if (options.has(name))
						fatal(`Option -${name} specified twice.`)

					options.set(name, value)
				}
			}
		} else {
			if (options.size)
				fatal(`Options must come last.`)

			commands.push(argument)
		}
	}

	consola.debug(commands)
	consola.debug(options)

	if (commands[0] == `version` || options.has(`version`)) {
		console.log(version)
		process.exit()
	}

	const poppedOptions = new Set<string>
	let complainedAboutUnrecognisedOptions = false

	const popOption = (name: string, { requirePresence = false, requireValue = false }: LaxPartial<{ requirePresence: boolean, requireValue: boolean }> = {}) => {
		if (complainedAboutUnrecognisedOptions) {
			consola.error(Error(`Tried to pop option after already complaining`))
			process.exit(2)
		}

		if (poppedOptions.has(name)) {
			consola.error(Error(`Tried to pop option --${name} twice.`))
			process.exit(2)
		}

		poppedOptions.add(name)

		if (options.has(name)) {
			const value = options.get(name)

			if (requireValue && value == undefined)
				fatal(`Option --${name} missing value.`)

			options.delete(name)

			return value
		}

		if (requirePresence)
			fatal(`Option --${name} missing.`)
	}

	const popFlagOption = (name: string) => {
		if (complainedAboutUnrecognisedOptions) {
			consola.error(Error(`Tried to pop option after already complaining`))
			process.exit(2)
		}

		if (poppedOptions.has(name)) {
			consola.error(Error(`Tried to pop option --${name} twice.`))
			process.exit(2)
		}

		poppedOptions.add(name)

		if (options.has(name)) {
			if (options.get(name) != undefined)
				fatal(`Option --${name} must not have value.`)

			options.delete(name)

			return true
		}

		return false
	}

	const complainAboutUnrecognisedOptions = () => {
		complainedAboutUnrecognisedOptions = true

		if (options.size)
			fatal(`Unknown option: --${options.keys().next().value}.`)
	}

	if (commands.length) {
		if (commands[0] == `get-time`) {
			if (commands.length < 2)
				fatal(`Missing argument.`)

			if (commands.length > 2)
				fatal(`Too many arguments.`)

			const ulid = commands[1]!

			if (!isUlid(ulid))
				fatal(`Invalid ULID.`)

			const time = getUlidBufferTime(decodeUlid(ulid))
			const formatOption = popOption(`format`, { requireValue: true })

			complainAboutUnrecognisedOptions()

			if (formatOption == `locale` || formatOption == undefined)
				console.log(new Date(time).toLocaleString())
			else if (formatOption == `locale-full`)
				console.log(new Date(time).toLocaleString(undefined, { dateStyle: `full`, timeStyle: `full` }))
			else if (formatOption == `iso`)
				console.log(new Date(time).toISOString())
			else if (formatOption == `epoch-milliseconds`)
				console.log(String(time))
			else
				fatal(`Unrecognised format ${JSON.stringify(formatOption)}.\nValid formats are "locale", "locale-full", "iso", and "epoch-milliseconds".`)

			process.exit()
		}

		if (commands[0] == `to-hex`) {
			if (commands.length < 2)
				fatal(`Missing argument.`)

			if (commands.length > 2)
				fatal(`Too many arguments.`)

			const ulid = commands[1]!

			if (!isUlid(ulid))
				fatal(`Invalid ULID.`)

			const ulidBuffer = decodeUlid(ulid)

			consola.debug(ulidBuffer)

			const lowercaseOption = popFlagOption(`lowercase`)
			const seperator = popOption(`seperator`, { requireValue: true }) ?? ` `

			complainAboutUnrecognisedOptions()

			const result = [ ...new Uint8Array(ulidBuffer) ]
				.map(byte => {
					let result = byte.toString(16)

					if (!lowercaseOption)
						result = result.toUpperCase()

					return result.padStart(2, `0`)
				})
				.join(seperator)

			console.log(result)
			process.exit()
		}

		if (commands[0] == `to-base64`) {
			if (commands.length < 2)
				fatal(`Missing argument.`)

			if (commands.length > 2)
				fatal(`Too many arguments.`)

			const urlOption = popFlagOption(`url`)

			complainAboutUnrecognisedOptions()

			const ulid = commands[1]!

			if (!isUlid(ulid))
				fatal(`Invalid ULID.`)

			const ulidBuffer = decodeUlid(ulid)

			consola.debug(ulidBuffer)

			const result = Buffer.from(ulidBuffer).toString(urlOption ? `base64url` : `base64`)

			console.log(result)
			process.exit()
		}

		if (commands[0] == `from-hex`) {
			if (commands.length < 2)
				fatal(`Missing argument.`)

			if (commands.length > 2)
				fatal(`Too many arguments.`)

			const hex = commands[1]!.replace(/\s/g, ``)

			if (hex.length < 32)
				fatal(`Hex too short, expected 32 hex characters.`)

			if (hex.length > 32)
				fatal(`Hex too long, expected 32 hex characters.`)

			if (!/^[\da-f]+$/i.test(hex))
				fatal(`Invalid hex.`)

			const buffer = Buffer.from(hex, `hex`)

			if (!(buffer.buffer instanceof ArrayBuffer)) {
				consola.error(Error(`Got ${buffer.buffer}`))
				process.exit(2)
			}

			const ulidBuffer = toUlidBuffer(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length))

			console.log(makeUlid({ ulidBuffer }))
			process.exit()
		}

		if (commands[0] == `from-base64`) {
			if (commands.length < 2)
				fatal(`Missing argument.`)

			if (commands.length > 2)
				fatal(`Too many arguments.`)

			const base64 = commands[1]!.replace(/[\s=]/g, ``)

			if (base64.length < 22)
				fatal(`Base64 too short, expected 22 base64 characters.`)

			if (base64.length > 22)
				fatal(`Base64 too long, expected 22 base64 characters.`)

			if (!/^[a-f\d+/-_]+$/i.test(base64))
				fatal(`Invalid Base64.`)

			if (base64[21] != `A` && base64[21] != `Q` && base64[21] != `g` && base64[21] != `w`)
				fatal(`Last character of base64 can only be one of "AQgw".`)

			const buffer = Buffer.from(base64, `base64`)

			if (!(buffer.buffer instanceof ArrayBuffer)) {
				consola.error(Error(`Got ${buffer.buffer}`))
				process.exit(2)
			}

			const ulidBuffer = toUlidBuffer(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length))

			console.log(makeUlid({ ulidBuffer }))
			process.exit()
		}

		fatal(`Unknown command: ${commands[0]}.`)
	}

	complainAboutUnrecognisedOptions()
	console.log(makeUlid())
	process.exit()
} catch (error) {
	consola.error(error)
	process.exit(2)
}
