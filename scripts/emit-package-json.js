#!/usr/bin/env node
import { mkdirSync as makeDirectorySync, writeFileSync } from "fs"
import packageJson_ from "../package.json" with { type: "json" }

const { private: _, dependencies, devDependencies, engines: { pnpm, ...engines }, ...packageJson } = packageJson_

makeDirectorySync("dist", { recursive: true })

writeFileSync(
	"dist/package.json",
	JSON.stringify({ ...packageJson, engines, dependencies }, undefined, "\t")
)

process.exit()
