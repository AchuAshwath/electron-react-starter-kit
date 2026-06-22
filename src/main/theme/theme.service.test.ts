import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../settings/settings.types";

const { nativeThemeMock, sentMessages, settingsLoggerMock, storeState } =
	vi.hoisted(() => ({
		nativeThemeMock: {
			shouldUseDarkColors: false,
			shouldUseDarkColorsForSystemIntegratedUI: false,
			themeSource: "system",
		},
		sentMessages: [] as Array<{ channel: string; value: unknown }>,
		settingsLoggerMock: {
			info: vi.fn(),
		},
		storeState: new Map<string, unknown>(),
	}));

vi.mock("electron", () => ({
	BrowserWindow: {
		getAllWindows: () => [
			{
				webContents: {
					send: (channel: string, value: unknown) => {
						sentMessages.push({ channel, value });
					},
				},
			},
		],
	},
	nativeTheme: nativeThemeMock,
}));

vi.mock("../logging/logger", () => ({
	settingsLogger: settingsLoggerMock,
}));

vi.mock("electron-store", () => {
	class MockStore {
		constructor({ defaults }: { defaults: Record<string, unknown> }) {
			storeState.clear();

			for (const [key, value] of Object.entries(defaults)) {
				storeState.set(key, structuredClone(value));
			}
		}

		get(key: string) {
			return storeState.get(key);
		}

		set(key: string, value: unknown) {
			storeState.set(key, value);
		}
	}

	return {
		default: MockStore,
	};
});

const {
	broadcastThemeState,
	getThemeState,
	setThemePreference,
	syncNativeThemeFromSettings,
} = await import("./theme.service");
const { resetSettings } = await import("../settings/settings.store");

describe("theme service", () => {
	beforeEach(() => {
		sentMessages.length = 0;
		nativeThemeMock.shouldUseDarkColors = false;
		nativeThemeMock.shouldUseDarkColorsForSystemIntegratedUI = false;
		nativeThemeMock.themeSource = "system";
		resetSettings();
	});

	it("resolves the persisted system preference through nativeTheme", () => {
		nativeThemeMock.shouldUseDarkColors = true;
		nativeThemeMock.shouldUseDarkColorsForSystemIntegratedUI = true;

		expect(syncNativeThemeFromSettings()).toEqual({
			preference: "system",
			resolvedTheme: "dark",
			systemPrefersDark: true,
		});
		expect(nativeThemeMock.themeSource).toBe("system");
	});

	it("persists explicit theme preferences and updates nativeTheme", () => {
		nativeThemeMock.shouldUseDarkColors = true;

		expect(setThemePreference("dark")).toEqual({
			preference: "dark",
			resolvedTheme: "dark",
			systemPrefersDark: false,
		});
		expect(nativeThemeMock.themeSource).toBe("dark");
		expect(storeState.get("settings")).toEqual({
			...defaultSettings,
			theme: "dark",
		});
		expect(settingsLoggerMock.info).toHaveBeenCalledWith(
			"Theme preference changed",
			{
				preference: "dark",
				resolvedTheme: "dark",
			},
		);
	});

	it("rejects invalid theme preferences", () => {
		expect(() => setThemePreference("banana" as never)).toThrow();
	});

	it("broadcasts the current theme state to all windows", () => {
		nativeThemeMock.shouldUseDarkColors = true;

		const themeState = broadcastThemeState();

		expect(themeState.resolvedTheme).toBe("dark");
		expect(sentMessages).toEqual([
			{
				channel: "theme:updated",
				value: themeState,
			},
		]);
	});

	it("reads current theme state without dropping the persisted preference", () => {
		setThemePreference("light");

		expect(getThemeState()).toEqual({
			preference: "light",
			resolvedTheme: "light",
			systemPrefersDark: false,
		});
	});
});
