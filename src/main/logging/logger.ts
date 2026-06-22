import log from "electron-log/main";

type ConfigureAppLoggingOptions = {
	isDev: boolean;
};

export const appLogger = log.scope("app");

export function configureAppLogging({
	isDev,
}: ConfigureAppLoggingOptions): void {
	log.initialize();

	log.transports.console.level = isDev ? "debug" : "warn";
	log.transports.file.level = "info";
	log.transports.file.format =
		"[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {scope} {text}";

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
