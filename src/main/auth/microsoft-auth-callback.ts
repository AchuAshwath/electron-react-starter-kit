import type { App } from "electron";
import type { MicrosoftAuthConfig } from "../config/app-config";
import { authLogger } from "../logging/logger";

type WaitForAuthorizationCodeRequest = {
	state: string;
};

type MicrosoftAuthCallbackCoordinatorOptions = {
	redirectUri: string;
	timeoutMs?: number;
};

type PendingAuthorization = {
	reject: (error: Error) => void;
	resolve: (code: string) => void;
	state: string;
	timeout: ReturnType<typeof setTimeout>;
};

export class MicrosoftAuthCallbackCoordinator {
	private readonly redirectUri: URL;
	private readonly timeoutMs: number;
	private pendingAuthorization: PendingAuthorization | null = null;

	constructor({
		redirectUri,
		timeoutMs = 5 * 60 * 1000,
	}: MicrosoftAuthCallbackCoordinatorOptions) {
		this.redirectUri = new URL(redirectUri);
		this.timeoutMs = timeoutMs;
	}

	waitForAuthorizationCode({
		state,
	}: WaitForAuthorizationCodeRequest): Promise<string> {
		if (this.pendingAuthorization) {
			return Promise.reject(
				new Error("A Microsoft sign-in flow is already pending."),
			);
		}

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.clearPendingAuthorization();
				reject(new Error("Microsoft sign-in timed out."));
			}, this.timeoutMs);

			this.pendingAuthorization = {
				reject,
				resolve,
				state,
				timeout,
			};
		});
	}

	handleRedirectUrl(rawUrl: string): boolean {
		const redirectUrl = this.parseRedirectUrl(rawUrl);
		if (!redirectUrl || !this.isExpectedRedirectUrl(redirectUrl)) {
			return false;
		}

		const pendingAuthorization = this.pendingAuthorization;
		if (!pendingAuthorization) {
			authLogger.warn("Microsoft auth redirect received without pending flow");
			return true;
		}

		const error = redirectUrl.searchParams.get("error");
		if (error) {
			this.rejectPendingAuthorization(
				new Error("Microsoft sign-in was cancelled or denied."),
			);
			return true;
		}

		const state = redirectUrl.searchParams.get("state");
		if (state !== pendingAuthorization.state) {
			this.rejectPendingAuthorization(
				new Error("Microsoft sign-in state did not match."),
			);
			return true;
		}

		const code = redirectUrl.searchParams.get("code");
		if (!code) {
			this.rejectPendingAuthorization(
				new Error("Microsoft sign-in did not return an authorization code."),
			);
			return true;
		}

		this.resolvePendingAuthorization(code);
		return true;
	}

	private parseRedirectUrl(rawUrl: string): URL | null {
		try {
			return new URL(rawUrl);
		} catch {
			return null;
		}
	}

	private isExpectedRedirectUrl(url: URL): boolean {
		return (
			url.protocol === this.redirectUri.protocol &&
			url.hostname === this.redirectUri.hostname &&
			url.pathname === this.redirectUri.pathname
		);
	}

	private resolvePendingAuthorization(code: string): void {
		const pendingAuthorization = this.clearPendingAuthorization();
		pendingAuthorization?.resolve(code);
	}

	private rejectPendingAuthorization(error: Error): void {
		const pendingAuthorization = this.clearPendingAuthorization();
		pendingAuthorization?.reject(error);
	}

	private clearPendingAuthorization(): PendingAuthorization | null {
		const pendingAuthorization = this.pendingAuthorization;
		if (!pendingAuthorization) {
			return null;
		}

		clearTimeout(pendingAuthorization.timeout);
		this.pendingAuthorization = null;
		return pendingAuthorization;
	}
}

type RegisterMicrosoftAuthProtocolHandlersOptions = {
	app: Pick<
		App,
		"on" | "quit" | "requestSingleInstanceLock" | "setAsDefaultProtocolClient"
	>;
	config: MicrosoftAuthConfig;
	coordinator: MicrosoftAuthCallbackCoordinator;
	argv?: string[];
	execPath?: string;
	isDefaultApp?: boolean;
};

export function registerMicrosoftAuthProtocolHandlers({
	app,
	config,
	coordinator,
	argv = process.argv,
	execPath = process.execPath,
	isDefaultApp = Boolean(process.defaultApp),
}: RegisterMicrosoftAuthProtocolHandlersOptions): boolean {
	const protocol = new URL(config.redirectUri).protocol.replace(/:$/, "");

	if (isDefaultApp && argv[1]) {
		app.setAsDefaultProtocolClient(protocol, execPath, [argv[1]]);
	} else {
		app.setAsDefaultProtocolClient(protocol);
	}

	const hasSingleInstanceLock = app.requestSingleInstanceLock();
	if (!hasSingleInstanceLock) {
		app.quit();
		return false;
	}

	app.on("open-url", (event, url) => {
		event.preventDefault();
		coordinator.handleRedirectUrl(url);
	});

	app.on("second-instance", (_event, secondInstanceArgv) => {
		handleProtocolUrlsFromArgv(secondInstanceArgv, coordinator);
	});

	handleProtocolUrlsFromArgv(argv, coordinator);

	return true;
}

function handleProtocolUrlsFromArgv(
	argv: string[],
	coordinator: MicrosoftAuthCallbackCoordinator,
): void {
	for (const arg of argv) {
		coordinator.handleRedirectUrl(arg);
	}
}
