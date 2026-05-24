import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";

export default defineConfig({
  main: {},
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
    plugins: [react(), tailwindcss()],
  },
});
