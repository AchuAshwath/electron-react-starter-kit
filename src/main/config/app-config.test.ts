import { describe, expect, it } from "vitest";
import { loadAppConfig } from "./app-config";

describe("loadAppConfig", () => {
	it("returns defaults when env is empty", () => {
		expect(loadAppConfig({})).toEqual({
			appUserModelId: "com.electron.react-starter-kit",
			logLevel: undefined,
			rendererDevUrl: undefined,
		});
	});

	it("parses APP_USER_MODEL_ID", () => {
		expect(
			loadAppConfig({ APP_USER_MODEL_ID: "com.example.desktop" })
				.appUserModelId,
		).toBe("com.example.desktop");
	});

	it("uses the default app user model id when APP_USER_MODEL_ID is blank", () => {
		expect(loadAppConfig({ APP_USER_MODEL_ID: "  " }).appUserModelId).toBe(
			"com.electron.react-starter-kit",
		);
	});

	it("parses APP_LOG_LEVEL", () => {
		expect(loadAppConfig({ APP_LOG_LEVEL: "info" }).logLevel).toBe("info");
	});

	it("treats a blank APP_LOG_LEVEL as unset", () => {
		expect(loadAppConfig({ APP_LOG_LEVEL: "" }).logLevel).toBeUndefined();
	});

	it("parses valid ELECTRON_RENDERER_URL into a URL", () => {
		const config = loadAppConfig({
			ELECTRON_RENDERER_URL: "http://localhost:5173",
		});

		expect(config.rendererDevUrl).toBeInstanceOf(URL);
		expect(config.rendererDevUrl?.toString()).toBe("http://localhost:5173/");
	});

	it("rejects invalid APP_LOG_LEVEL", () => {
		expect(() => loadAppConfig({ APP_LOG_LEVEL: "trace" })).toThrow();
	});

	it("rejects malformed ELECTRON_RENDERER_URL", () => {
		expect(() =>
			loadAppConfig({ ELECTRON_RENDERER_URL: "not a url" }),
		).toThrow();
	});
});
