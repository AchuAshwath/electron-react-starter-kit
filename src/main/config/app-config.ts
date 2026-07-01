import { z } from "zod";

export type AppLogLevel = "debug" | "info" | "warn" | "error";

export type MicrosoftAuthConfig = {
	clientId: string;
	tenantId: string;
	authority: URL;
	redirectUri: string;
	scopes: string[];
};

export type AppConfig = {
	appUserModelId: string;
	logLevel?: AppLogLevel;
	microsoftAuth?: MicrosoftAuthConfig;
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

const optionalUuidSchema = z.preprocess(
	(value) =>
		typeof value === "string" && value.trim() === "" ? undefined : value,
	z.uuid().optional(),
);

const optionalUrlSchema = (name: string) =>
	optionalNonEmptyString.transform((value, context) => {
		if (!value) {
			return undefined;
		}

		try {
			return new URL(value);
		} catch {
			context.addIssue({
				code: "custom",
				message: `${name} must be a valid URL.`,
			});

			return z.NEVER;
		}
	});

const appConfigEnvSchema = z.object({
	APP_LOG_LEVEL: appLogLevelSchema,
	APP_USER_MODEL_ID: optionalNonEmptyString.default(defaultAppUserModelId),
	ELECTRON_RENDERER_URL: optionalUrlSchema("ELECTRON_RENDERER_URL"),
	MICROSOFT_AUTH_AUTHORITY: optionalUrlSchema("MICROSOFT_AUTH_AUTHORITY"),
	MICROSOFT_AUTH_CLIENT_ID: optionalUuidSchema,
	MICROSOFT_AUTH_REDIRECT_URI: optionalNonEmptyString,
	MICROSOFT_AUTH_SCOPES: optionalNonEmptyString,
	MICROSOFT_AUTH_TENANT_ID: optionalUuidSchema,
});

function parseMicrosoftAuthConfig(
	env: z.infer<typeof appConfigEnvSchema>,
): MicrosoftAuthConfig | undefined {
	const values = [
		env.MICROSOFT_AUTH_AUTHORITY,
		env.MICROSOFT_AUTH_CLIENT_ID,
		env.MICROSOFT_AUTH_REDIRECT_URI,
		env.MICROSOFT_AUTH_SCOPES,
		env.MICROSOFT_AUTH_TENANT_ID,
	];

	if (values.every((value) => value === undefined)) {
		return undefined;
	}

	if (values.some((value) => value === undefined)) {
		throw new Error(
			"Microsoft auth config requires MICROSOFT_AUTH_CLIENT_ID, MICROSOFT_AUTH_TENANT_ID, MICROSOFT_AUTH_AUTHORITY, MICROSOFT_AUTH_REDIRECT_URI, and MICROSOFT_AUTH_SCOPES.",
		);
	}

	const clientId = env.MICROSOFT_AUTH_CLIENT_ID;
	const tenantId = env.MICROSOFT_AUTH_TENANT_ID;
	const authority = env.MICROSOFT_AUTH_AUTHORITY;
	const redirectUri = env.MICROSOFT_AUTH_REDIRECT_URI;
	const scopeText = env.MICROSOFT_AUTH_SCOPES;

	if (!clientId || !tenantId || !authority || !redirectUri || !scopeText) {
		throw new Error("Microsoft auth config is incomplete.");
	}

	const expectedAuthority = `https://login.microsoftonline.com/${tenantId}`;
	if (authority.toString().replace(/\/$/, "") !== expectedAuthority) {
		throw new Error(
			"MICROSOFT_AUTH_AUTHORITY must match MICROSOFT_AUTH_TENANT_ID.",
		);
	}

	validateMicrosoftLoopbackRedirectUri(redirectUri);

	const scopes = scopeText.split(/\s+/).filter(Boolean);
	if (scopes.length === 0) {
		throw new Error("MICROSOFT_AUTH_SCOPES must include at least one scope.");
	}

	return {
		authority,
		clientId,
		redirectUri,
		scopes,
		tenantId,
	};
}

function validateMicrosoftLoopbackRedirectUri(redirectUri: string): void {
	let url: URL;
	try {
		url = new URL(redirectUri);
	} catch {
		throw new Error("MICROSOFT_AUTH_REDIRECT_URI must be a valid URL.");
	}

	const isLoopbackHost = ["localhost", "127.0.0.1", "[::1]"].includes(
		url.hostname,
	);
	if (url.protocol !== "http:" || !isLoopbackHost) {
		throw new Error(
			"MICROSOFT_AUTH_REDIRECT_URI must use an HTTP localhost loopback URL.",
		);
	}

	if (!url.port) {
		throw new Error(
			"MICROSOFT_AUTH_REDIRECT_URI must include a localhost port.",
		);
	}

	if (!url.pathname || url.pathname === "/") {
		throw new Error(
			"MICROSOFT_AUTH_REDIRECT_URI must include a callback path.",
		);
	}
}
export function loadAppConfig(
	env: Record<string, string | undefined>,
): AppConfig {
	const parsedEnv = appConfigEnvSchema.parse(env);

	return {
		appUserModelId: parsedEnv.APP_USER_MODEL_ID,
		logLevel: parsedEnv.APP_LOG_LEVEL,
		microsoftAuth: parseMicrosoftAuthConfig(parsedEnv),
		rendererDevUrl: parsedEnv.ELECTRON_RENDERER_URL,
	};
}
