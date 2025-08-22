declare module "@kiosked/ulid" {
	export const ulid: () => string
	export const monotonicFactory: () => () => string
}
