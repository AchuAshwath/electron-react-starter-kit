import { describe, expect, it, vi } from "vitest";

const electronLogMock = vi.hoisted(() => {
	const appScope = {
		info: vi.fn(),
	};

	return {
		appScope,
		default: {
			errorHandler: {
				startCatching: vi.fn(),
			},
			eventLogger: {
				startLogging: vi.fn(),
			},
			initialize: vi.fn(),
			scope: vi.fn(() => appScope),
			transports: {
				console: {
					level: undefined,
				},
				file: {
					format: undefined,
					level: undefined,
				},
			},
		},
	};
});

vi.mock("electron-log/main", () => electronLogMock);

const { configureAppLogging } = await import("./logger");

describe("configureAppLogging", () => {
	it("configures verbose console logging in development", () => {
		configureAppLogging({ isDev: true });

		expect(electronLogMock.default.initialize).toHaveBeenCalledTimes(1);
		expect(electronLogMock.default.transports.console.level).toBe("debug");
		expect(electronLogMock.default.transports.file.level).toBe("info");
		expect(
			electronLogMock.default.eventLogger.startLogging,
		).toHaveBeenCalledWith({
			level: "warn",
			scope: "electron-event",
		});
		expect(
			electronLogMock.default.errorHandler.startCatching,
		).toHaveBeenCalledWith({
			showDialog: false,
		});
	});

	it("keeps production console logging quieter", () => {
		configureAppLogging({ isDev: false });

		expect(electronLogMock.default.transports.console.level).toBe("warn");
	});
});
