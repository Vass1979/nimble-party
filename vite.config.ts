import { defineConfig } from 'vite';

// Foundry loads `dist/nimble-party.js` as an ES module (see module.json).
// Styles, templates and lang files are shipped as static files at the module
// root and referenced directly by the manifest, so Vite only bundles the JS.
export default defineConfig({
	build: {
		sourcemap: true,
		minify: false,
		emptyOutDir: true,
		outDir: 'dist',
		lib: {
			entry: 'src/module.ts',
			formats: ['es'],
			fileName: () => 'nimble-party.js',
		},
		rollupOptions: {
			output: {
				// Single self-contained module file.
				inlineDynamicImports: true,
			},
		},
	},
});
