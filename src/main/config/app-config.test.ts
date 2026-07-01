import { describe, expect, it } from "vitest";
import { loadAppConfig } from "./app-config";

const microsoftClientId = "11111111-2222-4333-8444-555555555555";
const microsoftTenantId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function microsoftAuthEnv(overrides: Record<string, string | undefined> = {}) {
	return {
		MICROSOFT_AUTH_AUTHORITY: `https://login.microsoftonline.com/${microsoftTenantId}`,
		MICROSOFT_AUTH_CLIENT_ID: microsoftClientId,
		MICROSOFT_AUTH_REDIRECT_URI: `http://localhost:38987/auth/callback`,
		MICROSOFT_AUTH_SCOPES: "openid profile email offline_access User.Read",
		MICROSOFT_AUTH_TENANT_ID: microsoftTenantId,
		...overrides,
	};
}

describe("loadAppConfig", () => {
	it("returns defaults when env is empty", () => {
		expect(loadAppConfig({})).toEqual({
			appUserModelId: "com.electron.react-starter-kit",
			logLevel: undefined,
			microsoftAuth: undefined,
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

	it("parses Microsoft auth config", () => {
		const config = loadAppConfig(microsoftAuthEnv());

		expect(config.microsoftAuth).toEqual({
			authority: new URL(
				`https://login.microsoftonline.com/${microsoftTenantId}`,
			),
			clientId: microsoftClientId,
			redirectUri: `http://localhost:38987/auth/callback`,
			scopes: ["openid", "profile", "email", "offline_access", "User.Read"],
			tenantId: microsoftTenantId,
		});
	});

	it("trims and splits Microsoft auth scopes", () => {
		const config = loadAppConfig(
			microsoftAuthEnv({
				MICROSOFT_AUTH_SCOPES: "  openid   profile   User.Read  ",
			}),
		);

		expect(config.microsoftAuth?.scopes).toEqual([
			"openid",
			"profile",
			"User.Read",
		]);
	});

	it("rejects invalid APP_LOG_LEVEL", () => {
		expect(() => loadAppConfig({ APP_LOG_LEVEL: "trace" })).toThrow();
	});

	it("rejects malformed ELECTRON_RENDERER_URL", () => {
		expect(() =>
			loadAppConfig({ ELECTRON_RENDERER_URL: "not a url" }),
		).toThrow();
	});

	it("rejects incomplete Microsoft auth config", () => {
		expect(() =>
			loadAppConfig(
				microsoftAuthEnv({ MICROSOFT_AUTH_REDIRECT_URI: undefined }),
			),
		).toThrow(/Microsoft auth config requires/);
	});

	it("rejects invalid Microsoft client id", () => {
		expect(() =>
			loadAppConfig(microsoftAuthEnv({ MICROSOFT_AUTH_CLIENT_ID: "invalid" })),
		).toThrow();
	});

	it("rejects Microsoft authority that does not match tenant id", () => {
		expect(() =>
			loadAppConfig(
				microsoftAuthEnv({
					MICROSOFT_AUTH_AUTHORITY:
						"https://login.microsoftonline.com/11111111-2222-4333-8444-555555555555",
				}),
			),
		).toThrow(/MICROSOFT_AUTH_AUTHORITY/);
	});

	it("rejects Microsoft redirect URI that is not a loopback URL", () => {
		expect(() =>
			loadAppConfig(
				microsoftAuthEnv({
					MICROSOFT_AUTH_REDIRECT_URI: "https://example.com/auth",
				}),
			),
		).toThrow(/MICROSOFT_AUTH_REDIRECT_URI/);
	});
});
