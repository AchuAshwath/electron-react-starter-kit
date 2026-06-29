import { z } from "zod";

export type AppLogLevel = "debug" | "info" | "warn" | "error";

export type AppConfig = {
	appUserModelId: string;
	logLevel?: AppLogLevel;
	rendererDevUrl?: URL;
};

const defaultAppUserModelId = "com.electron.react-starter-kit";

const optionalNonEmptyString = z.preprocess(
	(value) =>
		typeof value === "string" && value.trim() === "" ? undefined : value,
	z.string().trim().optional(),
);

const appLogLevelSchema = z.preprocess(
	(value) =>
		typeof value === "string" && value.trim() === "" ? undefined : value,
	z.enum(["debug", "info", "warn", "error"]).optional(),
);

const appConfigEnvSchema = z.object({
	APP_LOG_LEVEL: appLogLevelSchema,
	APP_USER_MODEL_ID: optionalNonEmptyString.default(defaultAppUserModelId),
	ELECTRON_RENDERER_URL: optionalNonEmptyString.transform((value, context) => {
		if (!value) {
			return undefined;
		}

		try {
			return new URL(value);
		} catch {
			context.addIssue({
				code: "custom",
				message: "ELECTRON_RENDERER_URL must be a valid URL.",
			});

			return z.NEVER;
		}
	}),
});

export function loadAppConfig(
	env: Record<string, string | undefined>,
): AppConfig {
	const parsedEnv = appConfigEnvSchema.parse(env);

	return {
		appUserModelId: parsedEnv.APP_USER_MODEL_ID,
		logLevel: parsedEnv.APP_LOG_LEVEL,
		rendererDevUrl: parsedEnv.ELECTRON_RENDERER_URL,
	};
}
