import { createServer, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { authLogger } from "../logging/logger";

type WaitForAuthorizationCodeRequest = {
	signal?: AbortSignal;
	state: string;
};

type MicrosoftAuthCallbackServerOptions = {
	redirectUri: string;
	timeoutMs?: number;
};

type PendingAuthorization = {
	abortListener?: () => void;
	abortSignal?: AbortSignal;
	reject: (error: Error) => void;
	resolve: (code: string) => void;
	server: Server;
	state: string;
	timeout: ReturnType<typeof setTimeout>;
};

const successPath = "/auth/complete";
const failurePath = "/auth/error";

export class MicrosoftAuthCallbackServer {
	private readonly redirectUri: URL;
	private readonly timeoutMs: number;
	private pendingAuthorization: PendingAuthorization | null = null;

	constructor({
		redirectUri,
		timeoutMs = 5 * 60 * 1000,
	}: MicrosoftAuthCallbackServerOptions) {
		this.redirectUri = new URL(redirectUri);
		this.timeoutMs = timeoutMs;
	}

	waitForAuthorizationCode({
		signal,
		state,
	}: WaitForAuthorizationCodeRequest): Promise<string> {
		if (this.pendingAuthorization) {
			return Promise.reject(
				new Error("A Microsoft sign-in flow is already pending."),
			);
		}

		return new Promise((resolve, reject) => {
			if (signal?.aborted) {
				reject(new Error("Microsoft sign-in was cancelled."));
				return;
			}

			const server = createServer((request, response) => {
				const callbackUrl = this.createCallbackUrl(request.url);
				if (!callbackUrl) {
					this.writeNotFoundResponse(response);
					return;
				}

				if (callbackUrl.pathname === successPath) {
					this.writeCallbackResponse(response, true);
					return;
				}

				if (callbackUrl.pathname === failurePath) {
					this.writeCallbackResponse(response, false);
					return;
				}

				if (!this.isExpectedCallbackUrl(callbackUrl)) {
					this.writeNotFoundResponse(response);
					return;
				}

				this.handleCallbackUrl(callbackUrl, response);
			});

			const timeout = setTimeout(() => {
				this.rejectPendingAuthorization(
					new Error("Microsoft sign-in timed out."),
				);
			}, this.timeoutMs);
			const abortPendingAuthorization = () => {
				this.rejectPendingAuthorization(
					new Error("Microsoft sign-in was cancelled."),
				);
			};

			server.once("error", (error) => {
				clearTimeout(timeout);
				this.removeAbortListener(signal, abortPendingAuthorization);
				this.pendingAuthorization = null;
				reject(
					new Error(
						`Microsoft auth callback server failed to start: ${error.message}`,
					),
				);
			});

			signal?.addEventListener("abort", abortPendingAuthorization, {
				once: true,
			});
			this.pendingAuthorization = {
				abortListener: signal ? abortPendingAuthorization : undefined,
				abortSignal: signal,
				reject,
				resolve,
				server,
				state,
				timeout,
			};

			server.listen(this.getListenPort(), this.getListenHost());
		});
	}

	private createCallbackUrl(rawUrl: string | undefined): URL | null {
		if (!rawUrl) {
			return null;
		}

		try {
			return new URL(rawUrl, this.redirectUri.origin);
		} catch {
			return null;
		}
	}

	private isExpectedCallbackUrl(url: URL): boolean {
		return url.pathname === this.redirectUri.pathname;
	}

	private handleCallbackUrl(url: URL, response: ServerResponse): void {
		const pendingAuthorization = this.pendingAuthorization;
		if (!pendingAuthorization) {
			authLogger.warn("Microsoft auth callback received without pending flow");
			this.redirectToResultPage(response, false);
			return;
		}

		const error = url.searchParams.get("error");
		if (error) {
			this.redirectToResultPage(response, false);
			this.rejectPendingAuthorization(
				new Error("Microsoft sign-in was cancelled or denied."),
			);
			return;
		}

		const state = url.searchParams.get("state");
		if (state !== pendingAuthorization.state) {
			this.redirectToResultPage(response, false);
			this.rejectPendingAuthorization(
				new Error("Microsoft sign-in state did not match."),
			);
			return;
		}

		const code = url.searchParams.get("code");
		if (!code) {
			this.redirectToResultPage(response, false);
			this.rejectPendingAuthorization(
				new Error("Microsoft sign-in did not return an authorization code."),
			);
			return;
		}

		this.redirectToResultPage(response, true);
		this.resolvePendingAuthorization(code);
	}

	private redirectToResultPage(
		response: ServerResponse,
		succeeded: boolean,
	): void {
		response.writeHead(303, {
			"cache-control": "no-store",
			location: succeeded ? successPath : failurePath,
			"referrer-policy": "no-referrer",
		});
		response.end();
	}

	private writeNotFoundResponse(response: ServerResponse): void {
		response.writeHead(404, {
			"cache-control": "no-store",
			"content-type": "text/plain; charset=utf-8",
		});
		response.end("Not found");
	}

	private writeCallbackResponse(
		response: ServerResponse,
		succeeded: boolean,
	): void {
		response.writeHead(succeeded ? 200 : 400, {
			"cache-control": "no-store",
			"content-security-policy":
				"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
			"content-type": "text/html; charset=utf-8",
			"referrer-policy": "no-referrer",
		});
		response.end(createCallbackResponseHtml(succeeded));
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
		this.removeAbortListener(
			pendingAuthorization.abortSignal,
			pendingAuthorization.abortListener,
		);
		this.pendingAuthorization = null;
		setTimeout(() => pendingAuthorization.server.close(), 1000);
		return pendingAuthorization;
	}

	private removeAbortListener(
		signal: AbortSignal | undefined,
		listener: (() => void) | undefined,
	): void {
		if (signal && listener) {
			signal.removeEventListener("abort", listener);
		}
	}

	private getListenHost(): string {
		return this.redirectUri.hostname;
	}

	private getListenPort(): number {
		const port = Number(this.redirectUri.port);
		if (!Number.isInteger(port) || port <= 0) {
			throw new Error(
				"Microsoft auth redirect URI must include a localhost port.",
			);
		}

		return port;
	}

	getCallbackOriginForTest(): string {
		const address =
			this.pendingAuthorization?.server.address() as AddressInfo | null;
		if (!address) {
			return this.redirectUri.origin;
		}

		return `http://${this.redirectUri.hostname}:${address.port}`;
	}
}

function createCallbackResponseHtml(succeeded: boolean): string {
	const title = succeeded ? "Sign-in complete" : "Sign-in failed";
	const message = succeeded
		? "You can return to IDL Automation. This browser tab can be closed."
		: "The Microsoft sign-in flow did not complete. You can close this tab and try again from the app.";
	const accent = succeeded ? "#2563eb" : "#dc2626";
	const icon = succeeded ? "OK" : "!";

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>${title}</title>
	<style>
		:root { color-scheme: light dark; }
		* { box-sizing: border-box; }
		body {
			min-height: 100vh;
			margin: 0;
			display: grid;
			place-items: center;
			background: #0f172a;
			color: #e5e7eb;
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		}
		main {
			width: min(420px, calc(100vw - 32px));
			padding: 32px;
			border: 1px solid rgba(148, 163, 184, 0.24);
			border-radius: 16px;
			background: rgba(15, 23, 42, 0.92);
			box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
			text-align: center;
		}
		.icon {
			width: 48px;
			height: 48px;
			margin: 0 auto 18px;
			display: grid;
			place-items: center;
			border-radius: 999px;
			background: ${accent};
			color: white;
			font-size: 16px;
			font-weight: 700;
			letter-spacing: 0;
		}
		h1 {
			margin: 0 0 10px;
			font-size: 24px;
			line-height: 1.2;
		}
		p {
			margin: 0;
			color: #cbd5e1;
			font-size: 15px;
			line-height: 1.6;
		}
	</style>
</head>
<body>
	<main>
		<div class="icon" aria-hidden="true">${icon}</div>
		<h1>${title}</h1>
		<p>${message}</p>
	</main>
</body>
</html>`;
}
