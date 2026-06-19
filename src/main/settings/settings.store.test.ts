import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "./settings.types";

const { storeState } = vi.hoisted(() => ({
	storeState: new Map<string, unknown>(),
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

const { getSettings, resetSettings, updateSettings } = await import(
	"./settings.store"
);

describe("settings store", () => {
	beforeEach(() => {
		resetSettings();
	});

	it("returns default settings", () => {
		expect(getSettings()).toEqual(defaultSettings);
	});

	it("resets invalid persisted settings back to defaults", () => {
		storeState.set("settings", {
			...defaultSettings,
			theme: "banana",
		});

		expect(getSettings()).toEqual(defaultSettings);
		expect(storeState.get("settings")).toEqual(defaultSettings);
	});

	it("updates top-level and nested settings without dropping sibling values", () => {
		const settings = updateSettings({
			theme: "dark",
			windowBounds: {
				x: 40,
				width: 1200,
			},
		});

		expect(settings).toEqual({
			...defaultSettings,
			theme: "dark",
			windowBounds: {
				...defaultSettings.windowBounds,
				x: 40,
				width: 1200,
			},
		});
		expect(getSettings()).toEqual(settings);
	});

	it("preserves optional window state fields across partial updates", () => {
		updateSettings({
			windowBounds: {
				x: 20,
				y: 30,
				isMaximized: true,
			},
		});

		const settings = updateSettings({
			windowBounds: {
				width: 1280,
			},
		});

		expect(settings.windowBounds).toEqual({
			...defaultSettings.windowBounds,
			x: 20,
			y: 30,
			width: 1280,
			isMaximized: true,
		});
	});

	it("resets persisted settings back to defaults", () => {
		updateSettings({
			startup: {
				openDevTools: true,
			},
		});

		expect(resetSettings()).toEqual(defaultSettings);
	});
});
