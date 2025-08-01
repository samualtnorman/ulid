#!/usr/bin/env node
import { mkdirSync as makeDirectorySync, writeFileSync } from "fs"
import packageJson from "../package.json" with { type: "json" }

/** @type {Record<string, string>} */ const ConvertToJsr = {
	"@samual/types": "@samual/types"
}

const { version, license, dependencies } = packageJson

makeDirectorySync("dist", { recursive: true })

const imports = Object.fromEntries(Object.entries(dependencies).map(
	([ name, version ],) => [ name, `${name in ConvertToJsr ? `jsr:${ConvertToJsr[name]}` : `npm:${name}`}@${version}` ]
))

writeFileSync(
	"dist/jsr.json",
	JSON.stringify({ name: `@sn/ulid`, version, license, exports: { ".": "./default.ts" }, imports }, undefined, "\t")
)

process.exit()
