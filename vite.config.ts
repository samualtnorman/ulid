import babelPluginSyntaxTypescript from "@babel/plugin-syntax-typescript"
import { babel } from "@rollup/plugin-babel"
import { babelPluginHere } from "babel-plugin-here"
import { babelPluginVitest } from "babel-plugin-vitest"
import type { UserConfig } from "vite"

export default {
	plugins: [
		{
			...babel({
				babelHelpers: "bundled",
				extensions: [ ".ts" ],
				plugins: [ babelPluginSyntaxTypescript, babelPluginHere(), babelPluginVitest() ]
			}),
			enforce: "pre"
		}
	]
} satisfies UserConfig
