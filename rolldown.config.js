#!node_modules/.bin/rolldown --config
import { rolldownConfig } from "@samual/rolldown-config"
import Path from "path"

export default rolldownConfig(
	process.env.JSR
		? {
			rolldownOptions: { output: { banner: chunk => `// @ts-self-types="./${Path.basename(chunk.name)}.d.ts"` } },
			terserOptions: { format: { comments: /@ts-self-types/ } }
		}
		: undefined
)
