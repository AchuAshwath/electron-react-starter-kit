import log from "electron-log/main";

type ConfigureAppLoggingOptions = {
	isDev: boolean;
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
