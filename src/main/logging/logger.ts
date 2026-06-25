import log from "electron-log/main";

type ConfigureAppLoggingOptions = {
	isDev: boolean;
};

type ElectronEventLogInput = {
	args: unknown[];
	eventName: string;
	eventSource: string;
};

const consoleLogFormat = "%c{h}:{i}:{s}.{ms} [{level}]{scope}%c | {text}";
const fileLogFormat = "[{iso}] [{level}]{scope} {text}";

const consoleLevelColors = {
	debug: "gray",
	default: "unset",
	error: "red",
	info: "green",
	silly: "gray",
	verbose: "cyan",
	warn: "yellow",
};

export function createLogger(scope: string) {
	return log.scope(scope);
}

export const appLogger = createLogger("app");
export const authLogger = createLogger("auth");
export const notificationLogger = createLogger("notifications");
export const settingsLogger = createLogger("settings");
export const windowLogger = createLogger("window");

export function configureAppLogging({
	isDev,
}: ConfigureAppLoggingOptions): void {
	log.initialize({
		preload: false,
		spyRendererConsole: false,
	});

	log.transports.console.level = isDev ? "debug" : "warn";
	log.transports.console.format = consoleLogFormat;
	log.transports.console.colorMap = consoleLevelColors;
	log.transports.console.useStyles = isDev;

	log.transports.file.level = "info";
	log.transports.file.format = fileLogFormat;

	log.eventLogger.startLogging({
		events: {
			app: {
				"child-process-gone": true,
				"render-process-gone": true,
			},
			webContents: {
				"did-fail-load": true,
				"did-fail-provisional-load": true,
				unresponsive: true,
			},
		},
		format: formatElectronEventLog,
		level: "warn",
		scope: "electron-event",
	});

	log.errorHandler.startCatching({
		showDialog: false,
	});

	appLogger.info("Logging initialized", {
		consoleLevel: log.transports.console.level,
		fileLevel: log.transports.file.level,
	});
}

function formatElectronEventLog({
	args,
	eventName,
	eventSource,
}: ElectronEventLogInput): unknown[] {
	return [
		`${eventSource}:${eventName}`,
		{
			eventName,
			eventSource,
			...getSanitizedElectronEventDetails(eventName, args),
		},
	];
}

function getSanitizedElectronEventDetails(
	eventName: string,
	args: unknown[],
): Record<string, unknown> {
	if (eventName === "child-process-gone") {
		return getObjectRecord(args[0]);
	}

	if (eventName === "render-process-gone") {
		return getObjectRecord(args[1]);
	}

	if (
		eventName === "did-fail-load" ||
		eventName === "did-fail-provisional-load"
	) {
		return {
			errorCode: args[0],
			errorDescription: args[1],
			isMainFrame: args[3],
		};
	}

	return {};
}

function getObjectRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	return value as Record<string, unknown>;
}
