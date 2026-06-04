import { beforeEach, describe, expect, it, vi } from "vitest";
import { themeQueries } from "./theme.queries";
import type { ThemeState } from "./theme.types";

const themeState: ThemeState = {
	preference: "system",
	resolvedTheme: "dark",
	systemPrefersDark: true,
};

const apiMock = {
	getAppVersion: vi.fn<Window["api"]["getAppVersion"]>(),
	getSystemInfo: vi.fn<Window["api"]["getSystemInfo"]>(),
	settings: {
		get: vi.fn<Window["api"]["settings"]["get"]>(),
		update: vi.fn<Window["api"]["settings"]["update"]>(),
		reset: vi.fn<Window["api"]["settings"]["reset"]>(),
	},
	theme: {
		get: vi.fn<Window["api"]["theme"]["get"]>(),
		setPreference: vi.fn<Window["api"]["theme"]["setPreference"]>(),
		onUpdated: vi.fn<Window["api"]["theme"]["onUpdated"]>(),
	},
};

describe("themeQueries", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		Object.defineProperty(window, "api", {
			configurable: true,
			value: apiMock,
		});
	});

	it("builds hierarchical query keys", () => {
		expect(themeQueries.all()).toEqual(["theme"]);
		expect(themeQueries.current().queryKey).toEqual(["theme", "current"]);
	});

	it("fetches current theme through the preload bridge", async () => {
		apiMock.theme.get.mockResolvedValue(themeState);

		const queryFn = themeQueries.current().queryFn as () => Promise<ThemeState>;

		await expect(queryFn()).resolves.toEqual(themeState);
		expect(apiMock.theme.get).toHaveBeenCalledTimes(1);
	});
});
