import { describe, expect, it, vi } from "vitest";
import type { MicrosoftAuthConfig } from "../config/app-config";
import {
	MicrosoftAuthCallbackCoordinator,
	registerMicrosoftAuthProtocolHandlers,
} from "./microsoft-auth-callback";

function createMicrosoftAuthConfig(): MicrosoftAuthConfig {
	const tenantId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
	const clientId = "11111111-2222-4333-8444-555555555555";

	return {
		authority: new URL(`https://login.microsoftonline.com/${tenantId}`),
		clientId,
		redirectUri: `msal${clientId}://auth`,
		scopes: ["openid", "profile", "email", "offline_access", "User.Read"],
		tenantId,
	};
}

function createProtocolApp({
	hasSingleInstanceLock = true,
}: {
	hasSingleInstanceLock?: boolean;
} = {}) {
	return {
		on: vi.fn(),
		quit: vi.fn(),
		requestSingleInstanceLock: vi.fn(() => hasSingleInstanceLock),
		setAsDefaultProtocolClient: vi.fn(),
	};
}

describe("MicrosoftAuthCallbackCoordinator", () => {
	it("resolves a pending authorization when the redirect URL contains the expected state and code", async () => {
		const coordinator = new MicrosoftAuthCallbackCoordinator({
			redirectUri: "msal11111111-2222-4333-8444-555555555555://auth",
		});

		const authorizationCode = coordinator.waitForAuthorizationCode({
			state: "state",
		});
		const handled = coordinator.handleRedirectUrl(
			"msal11111111-2222-4333-8444-555555555555://auth?code=authorization-code&state=state",
		);

		expect(handled).toBe(true);
		await expect(authorizationCode).resolves.toBe("authorization-code");
	});

	it("ignores URLs that do not match the configured redirect URI", () => {
		const coordinator = new MicrosoftAuthCallbackCoordinator({
			redirectUri: "msal11111111-2222-4333-8444-555555555555://auth",
		});

		expect(coordinator.handleRedirectUrl("https://example.com/auth")).toBe(
			false,
		);
		expect(
			coordinator.handleRedirectUrl(
				"msaldifferent-client://auth?code=authorization-code&state=state",
			),
		).toBe(false);
	});

	it("rejects a pending authorization when the redirect state does not match", async () => {
		const coordinator = new MicrosoftAuthCallbackCoordinator({
			redirectUri: "msal11111111-2222-4333-8444-555555555555://auth",
		});

		const authorizationCode = coordinator.waitForAuthorizationCode({
			state: "expected-state",
		});
		coordinator.handleRedirectUrl(
			"msal11111111-2222-4333-8444-555555555555://auth?code=authorization-code&state=wrong-state",
		);

		await expect(authorizationCode).rejects.toThrow(
			"Microsoft sign-in state did not match.",
		);
	});

	it("rejects a pending authorization when the redirect contains an error", async () => {
		const coordinator = new MicrosoftAuthCallbackCoordinator({
			redirectUri: "msal11111111-2222-4333-8444-555555555555://auth",
		});

		const authorizationCode = coordinator.waitForAuthorizationCode({
			state: "state",
		});
		coordinator.handleRedirectUrl(
			"msal11111111-2222-4333-8444-555555555555://auth?error=access_denied&state=state",
		);

		await expect(authorizationCode).rejects.toThrow(
			"Microsoft sign-in was cancelled or denied.",
		);
	});

	it("rejects a pending authorization when the redirect does not include a code", async () => {
		const coordinator = new MicrosoftAuthCallbackCoordinator({
			redirectUri: "msal11111111-2222-4333-8444-555555555555://auth",
		});

		const authorizationCode = coordinator.waitForAuthorizationCode({
			state: "state",
		});
		coordinator.handleRedirectUrl(
			"msal11111111-2222-4333-8444-555555555555://auth?state=state",
		);

		await expect(authorizationCode).rejects.toThrow(
			"Microsoft sign-in did not return an authorization code.",
		);
	});

	it("rejects a second pending authorization", async () => {
		const coordinator = new MicrosoftAuthCallbackCoordinator({
			redirectUri: "msal11111111-2222-4333-8444-555555555555://auth",
		});

		const authorizationCode = coordinator.waitForAuthorizationCode({
			state: "state",
		});

		await expect(
			coordinator.waitForAuthorizationCode({ state: "other-state" }),
		).rejects.toThrow("A Microsoft sign-in flow is already pending.");

		coordinator.handleRedirectUrl(
			"msal11111111-2222-4333-8444-555555555555://auth?code=authorization-code&state=state",
		);
		await expect(authorizationCode).resolves.toBe("authorization-code");
	});

	it("times out when a redirect never arrives", async () => {
		vi.useFakeTimers();
		const coordinator = new MicrosoftAuthCallbackCoordinator({
			redirectUri: "msal11111111-2222-4333-8444-555555555555://auth",
			timeoutMs: 1000,
		});

		const authorizationCode = coordinator.waitForAuthorizationCode({
			state: "state",
		});

		vi.advanceTimersByTime(1000);

		await expect(authorizationCode).rejects.toThrow(
			"Microsoft sign-in timed out.",
		);
		vi.useRealTimers();
	});
});

describe("registerMicrosoftAuthProtocolHandlers", () => {
	it("registers the Microsoft redirect protocol and second-instance handlers", () => {
		const app = createProtocolApp();
		const coordinator = new MicrosoftAuthCallbackCoordinator({
			redirectUri: createMicrosoftAuthConfig().redirectUri,
		});

		expect(
			registerMicrosoftAuthProtocolHandlers({
				app,
				config: createMicrosoftAuthConfig(),
				coordinator,
				argv: ["electron.exe"],
				execPath: "electron.exe",
				isDefaultApp: false,
			}),
		).toBe(true);

		expect(app.setAsDefaultProtocolClient).toHaveBeenCalledWith(
			"msal11111111-2222-4333-8444-555555555555",
		);
		expect(app.requestSingleInstanceLock).toHaveBeenCalled();
		expect(app.on).toHaveBeenCalledWith("open-url", expect.any(Function));
		expect(app.on).toHaveBeenCalledWith(
			"second-instance",
			expect.any(Function),
		);
	});

	it("includes the app entry path when running as Electron default app", () => {
		const app = createProtocolApp();
		const coordinator = new MicrosoftAuthCallbackCoordinator({
			redirectUri: createMicrosoftAuthConfig().redirectUri,
		});

		registerMicrosoftAuthProtocolHandlers({
			app,
			config: createMicrosoftAuthConfig(),
			coordinator,
			argv: ["electron.exe", "app-main.js"],
			execPath: "electron.exe",
			isDefaultApp: true,
		});

		expect(app.setAsDefaultProtocolClient).toHaveBeenCalledWith(
			"msal11111111-2222-4333-8444-555555555555",
			"electron.exe",
			["app-main.js"],
		);
	});

	it("quits and returns false when another instance owns the lock", () => {
		const app = createProtocolApp({ hasSingleInstanceLock: false });
		const coordinator = new MicrosoftAuthCallbackCoordinator({
			redirectUri: createMicrosoftAuthConfig().redirectUri,
		});

		expect(
			registerMicrosoftAuthProtocolHandlers({
				app,
				config: createMicrosoftAuthConfig(),
				coordinator,
			}),
		).toBe(false);
		expect(app.quit).toHaveBeenCalled();
	});
});
