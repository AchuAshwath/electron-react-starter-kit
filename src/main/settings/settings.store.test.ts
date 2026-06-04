import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "./settings.types";

const { storeState } = vi.hoisted(() => ({
	storeState: new Map<string, unknown>(),
}));

vi.mock("electron-store", () => {
	return {
		default: vi.fn().mockImplementation(({ defaults }) => {
			storeState.clear();

			for (const [key, value] of Object.entries(defaults)) {
				storeState.set(key, structuredClone(value));
			}

			return {
				get: (key: string) => storeState.get(key),
				set: (key: string, value: unknown) => storeState.set(key, value),
			};
		}),
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

	it("updates top-level and nested settings without dropping sibling values", () => {
		const settings = updateSettings({
			theme: "dark",
			windowBounds: {
				width: 1200,
			},
		});

		expect(settings).toEqual({
			...defaultSettings,
			theme: "dark",
			windowBounds: {
				...defaultSettings.windowBounds,
				width: 1200,
			},
		});
		expect(getSettings()).toEqual(settings);
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
