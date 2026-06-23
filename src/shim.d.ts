/**
 * Minimal ambient declarations for the Foundry VTT globals this module touches.
 *
 * This keeps the project self-contained and buildable with a plain `vite build`
 * (esbuild transpile, no typecheck gate) without pulling in the full
 * `fvtt-types` dependency. If you later add `fvtt-types` to Nimble Party, delete
 * this file and lean on the real definitions instead.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
	const game: any;
	const ui: any;
	const canvas: any;
	const CONFIG: any;
	const CONST: any;
	const Hooks: any;
	const foundry: any;
	const Actor: any;
	const Macro: any;
	const ChatMessage: any;

	interface Window {
		game: any;
	}
}

export {};
