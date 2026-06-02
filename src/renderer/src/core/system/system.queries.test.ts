import { beforeEach, describe, expect, it, vi } from "vitest";
import { systemQueries } from "./system.queries";

const apiMock = {
	getAppVersion: vi.fn<Window["api"]["getAppVersion"]>(),
	getSystemInfo: vi.fn<Window["api"]["getSystemInfo"]>(),
};

describe("systemQueries", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		Object.defineProperty(window, "api", {
			configurable: true,
			value: apiMock,
		});
	});

	it("builds hierarchical query keys", () => {
		expect(systemQueries.all()).toEqual(["system"]);
		expect(systemQueries.version().queryKey).toEqual(["system", "version"]);
		expect(systemQueries.info().queryKey).toEqual(["system", "info"]);
	});

	it("fetches app version through the preload bridge", async () => {
		apiMock.getAppVersion.mockResolvedValue("1.2.3");

		const queryFn = systemQueries.version().queryFn as () => Promise<string>;

		await expect(queryFn()).resolves.toBe("1.2.3");
		expect(apiMock.getAppVersion).toHaveBeenCalledTimes(1);
	});

	it("fetches system info through the preload bridge", async () => {
		const systemInfo = {
			arch: "x64",
			chromeVersion: "120.0.0",
			electronVersion: "39.0.0",
			nodeVersion: "22.0.0",
			platform: "win32",
		};
		apiMock.getSystemInfo.mockResolvedValue(systemInfo);

		const queryFn = systemQueries.info().queryFn as () => Promise<
			typeof systemInfo
		>;

		await expect(queryFn()).resolves.toEqual(systemInfo);
		expect(apiMock.getSystemInfo).toHaveBeenCalledTimes(1);
	});
});
