export const foo = `bar`

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`add 1 and 1`, () => {
		expect(1 + 1).toBe(2)
	})
}
