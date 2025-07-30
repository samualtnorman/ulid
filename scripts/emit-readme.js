#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs"

writeFileSync(`readme.md`, readFileSync(`src/readme.md`, { encoding: `utf8` }).replaceAll(`{PACKAGE_NAME}`, `tiny-ulid`))
