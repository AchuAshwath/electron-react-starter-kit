import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tsconfigPaths({ projects: ["tsconfig.web.json"] })],
	test: {
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
		},
		environment: "jsdom",
		globals: false,
		setupFiles: "./src/renderer/src/test/setup.ts",
	},
});
