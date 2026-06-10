import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";

export default defineConfig({
	main: {
		build: {
			externalizeDeps: {
				exclude: ["electron-store"],
			},
		},
	},
	preload: {},
	renderer: {
		resolve: {
			alias: {
				"@renderer": resolve("src/renderer/src"),
				components: resolve("src/renderer/src/components"),
				ui: resolve("src/renderer/src/components/ui"),
				lib: resolve("src/renderer/src/lib"),
				hooks: resolve("src/renderer/src/hooks"),
				utils: resolve("src/renderer/src/lib/utils"),
			},
		},
		plugins: [
			tanstackRouter({
				target: "react",
				autoCodeSplitting: true,
				routesDirectory: resolve("./src/renderer/src/routes"),
				generatedRouteTree: resolve("./src/renderer/src/routeTree.gen.ts"),
			}),
			react(),
			tailwindcss(),
		],
	},
});
