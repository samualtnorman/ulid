#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";

const [ ,, readmePath, targetPath ] = process.argv

if (!(readmePath && targetPath))
	process.exit(1)

const readme = readFileSync(readmePath, { encoding: `utf8` })
	.trim()
	.replaceAll(`{PACKAGE_NAME}`, `@sn/ulid`)
	.replaceAll(`*/`, `*\u200D/`)
	.replaceAll(`\n`, `\n * `)

const targetContent = readFileSync(targetPath, { encoding: `utf8` })

writeFileSync(targetPath, `/**\n * ${readme}\n * @module\n */\n${targetContent}`,)
