import { describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
	session: {
		defaultSession: {
			setPermissionRequestHandler: vi.fn(),
		},
	},
	shell: {
		openExternal: vi.fn(),
	},
}));

import { isTrustedIpcSenderUrl } from "./security";

describe("isTrustedIpcSenderUrl", () => {
	it.each([
		"http://localhost:5173",
		"http://127.0.0.1:5173",
		"http://[::1]:5173",
	])("trusts dev loopback renderer URLs: %s", (url) => {
		expect(isTrustedIpcSenderUrl(url, { isDev: true })).toBe(true);
	});

	it.each([
		"https://example.com",
		"http://example.com",
		"file:///app.html",
	])("rejects non-dev renderer URLs in dev: %s", (url) => {
		expect(isTrustedIpcSenderUrl(url, { isDev: true })).toBe(false);
	});

	it("trusts packaged file URLs outside dev", () => {
		expect(
			isTrustedIpcSenderUrl("file:///app/renderer/index.html", {
				isDev: false,
			}),
		).toBe(true);
	});

	it.each([
		"https://example.com",
		"http://localhost:5173",
		"not-a-url",
	])("rejects non-file URLs outside dev: %s", (url) => {
		expect(isTrustedIpcSenderUrl(url, { isDev: false })).toBe(false);
	});
});
