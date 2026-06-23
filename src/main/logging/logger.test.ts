import { describe, expect, it, vi } from "vitest";

const electronLogMock = vi.hoisted(() => {
	const scopes = new Map<
		string,
		{
			info: ReturnType<typeof vi.fn>;
			warn: ReturnType<typeof vi.fn>;
		}
	>();

	function getScope(scope: string) {
		const existingScope = scopes.get(scope);

		if (existingScope) {
			return existingScope;
		}

		const nextScope = {
			info: vi.fn(),
			warn: vi.fn(),
		};

		scopes.set(scope, nextScope);

		return nextScope;
	}

	return {
		getScope,
		default: {
			errorHandler: {
				startCatching: vi.fn(),
			},
			eventLogger: {
				startLogging: vi.fn(),
			},
			initialize: vi.fn(),
			scope: vi.fn(getScope),
			transports: {
				console: {
					colorMap: undefined,
					format: undefined,
					level: undefined,
					useStyles: undefined,
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

const { appLogger, configureAppLogging, createLogger } = await import(
	"./logger"
);

describe("createLogger", () => {
	it("creates scoped loggers", () => {
		expect(createLogger("window")).toBe(electronLogMock.getScope("window"));
		expect(appLogger).toBe(electronLogMock.getScope("app"));
	});
});

describe("configureAppLogging", () => {
	it("configures verbose console logging in development", () => {
		configureAppLogging({ isDev: true });

		expect(electronLogMock.default.initialize).toHaveBeenCalledWith({
			preload: false,
			spyRendererConsole: false,
		});
		expect(electronLogMock.default.transports.console.level).toBe("debug");
		expect(electronLogMock.default.transports.console.format).toBe(
			"%c{h}:{i}:{s}.{ms} [{level}]{scope}%c | {text}",
		);
		expect(electronLogMock.default.transports.console.colorMap).toEqual({
			debug: "gray",
			default: "unset",
			error: "red",
			info: "green",
			silly: "gray",
			verbose: "cyan",
			warn: "yellow",
		});
		expect(electronLogMock.default.transports.console.useStyles).toBe(true);
		expect(electronLogMock.default.transports.file.level).toBe("info");
		expect(electronLogMock.default.transports.file.format).toBe(
			"[{iso}] [{level}]{scope} {text}",
		);
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
		expect(electronLogMock.default.transports.console.useStyles).toBe(false);
	});
});
