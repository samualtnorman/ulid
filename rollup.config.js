#!node_modules/.bin/rollup --config
import { rollupConfig } from "@samual/rollup-config"
import Path from "path"

export default (/** @type {Record<string, unknown>} */ args) => rollupConfig(
	args.configJsr
		? {
			rollupOptions: { output: { banner: chunk => `// @ts-self-types="./${Path.basename(chunk.name)}.d.ts"` } },
			terserOptions: { format: { comments: /@ts-self-types/ } }
		}
		: undefined
)
