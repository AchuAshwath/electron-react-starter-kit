import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../../../../main/settings/settings.types";
import { settingsQueries } from "./settings.queries";

const apiMock = {
	getAppVersion: vi.fn<Window["api"]["getAppVersion"]>(),
	getSystemInfo: vi.fn<Window["api"]["getSystemInfo"]>(),
	settings: {
		get: vi.fn<Window["api"]["settings"]["get"]>(),
		update: vi.fn<Window["api"]["settings"]["update"]>(),
		reset: vi.fn<Window["api"]["settings"]["reset"]>(),
	},
};

describe("settingsQueries", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		Object.defineProperty(window, "api", {
			configurable: true,
			value: apiMock,
		});
	});

	it("builds hierarchical query keys", () => {
		expect(settingsQueries.all()).toEqual(["settings"]);
		expect(settingsQueries.current().queryKey).toEqual(["settings", "current"]);
	});

	it("fetches current settings through the preload bridge", async () => {
		apiMock.settings.get.mockResolvedValue(defaultSettings);

		const queryFn = settingsQueries.current().queryFn as () => Promise<
			typeof defaultSettings
		>;

		await expect(queryFn()).resolves.toEqual(defaultSettings);
		expect(apiMock.settings.get).toHaveBeenCalledTimes(1);
	});
});
