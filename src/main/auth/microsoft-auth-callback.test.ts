import { createServer, get, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { MicrosoftAuthCallbackServer } from "./microsoft-auth-callback";

async function getFreePort(): Promise<number> {
	const server = createServer();
	await new Promise<void>((resolve) => {
		server.listen(0, "127.0.0.1", resolve);
	});
	const address = server.address() as AddressInfo;
	const port = address.port;
	await new Promise<void>((resolve, reject) => {
		server.close((error) => (error ? reject(error) : resolve()));
	});

	return port;
}

function requestCallback(url: string): Promise<{
	body: string;
	headers: Record<string, string | string[] | undefined>;
	statusCode: number;
}> {
	return new Promise((resolve, reject) => {
		get(url, (response) => {
			let body = "";
			response.setEncoding("utf8");
			response.on("data", (chunk) => {
				body += chunk;
			});
			response.on("end", () => {
				resolve({
					body,
					headers: response.headers,
					statusCode: response.statusCode ?? 0,
				});
			});
		}).on("error", reject);
	});
}

async function createCallbackServer(timeoutMs = 1000) {
	const port = await getFreePort();
	const redirectUri = `http://127.0.0.1:${port}/auth/callback`;

	return {
		callbackUrl: (query: string) => `${redirectUri}?${query}`,
		origin: `http://127.0.0.1:${port}`,
		server: new MicrosoftAuthCallbackServer({ redirectUri, timeoutMs }),
	};
}

async function createOccupiedPortServer(): Promise<{
	port: number;
	server: Server;
}> {
	const server = createServer((_request, response) => {
		response.end("occupied");
	});
	await new Promise<void>((resolve) => {
		server.listen(0, "127.0.0.1", resolve);
	});
	const address = server.address() as AddressInfo;

	return { port: address.port, server };
}

describe("MicrosoftAuthCallbackServer", () => {
	it("redirects to a clean completion page after receiving the expected state and code", async () => {
		const { callbackUrl, origin, server } = await createCallbackServer();
		const authorizationCode = server.waitForAuthorizationCode({
			state: "state",
		});

		const callbackResponse = await requestCallback(
			callbackUrl("code=authorization-code&state=state"),
		);
		const completionResponse = await requestCallback(`${origin}/auth/complete`);

		expect(callbackResponse.statusCode).toBe(303);
		expect(callbackResponse.headers.location).toBe("/auth/complete");
		expect(completionResponse.statusCode).toBe(200);
		expect(completionResponse.body).toContain("Sign-in complete");
		await expect(authorizationCode).resolves.toBe("authorization-code");
	});

	it("returns 404 for unrelated loopback paths", async () => {
		const { server } = await createCallbackServer();
		const authorizationCode = server.waitForAuthorizationCode({
			state: "state",
		});
		const origin = server.getCallbackOriginForTest();

		const response = await requestCallback(`${origin}/other?code=ignored`);

		expect(response.statusCode).toBe(404);
		await requestCallback(
			`${origin}/auth/callback?code=authorization-code&state=state`,
		);
		await expect(authorizationCode).resolves.toBe("authorization-code");
	});

	it("rejects a pending authorization when the callback state does not match", async () => {
		const { callbackUrl, server } = await createCallbackServer();
		const authorizationCode = server.waitForAuthorizationCode({
			state: "expected-state",
		});
		const rejectionExpectation = expect(authorizationCode).rejects.toThrow(
			"Microsoft sign-in state did not match.",
		);

		const response = await requestCallback(
			callbackUrl("code=authorization-code&state=wrong-state"),
		);

		expect(response.statusCode).toBe(303);
		expect(response.headers.location).toBe("/auth/error");
		await rejectionExpectation;
	});

	it("rejects a pending authorization when Microsoft returns an error", async () => {
		const { callbackUrl, server } = await createCallbackServer();
		const authorizationCode = server.waitForAuthorizationCode({
			state: "state",
		});
		const rejectionExpectation = expect(authorizationCode).rejects.toThrow(
			"Microsoft sign-in was cancelled or denied.",
		);

		const response = await requestCallback(
			callbackUrl("error=access_denied&state=state"),
		);

		expect(response.statusCode).toBe(303);
		expect(response.headers.location).toBe("/auth/error");
		await rejectionExpectation;
	});

	it("rejects a pending authorization when the callback does not include a code", async () => {
		const { callbackUrl, server } = await createCallbackServer();
		const authorizationCode = server.waitForAuthorizationCode({
			state: "state",
		});
		const rejectionExpectation = expect(authorizationCode).rejects.toThrow(
			"Microsoft sign-in did not return an authorization code.",
		);

		const response = await requestCallback(callbackUrl("state=state"));

		expect(response.statusCode).toBe(303);
		expect(response.headers.location).toBe("/auth/error");
		await rejectionExpectation;
	});

	it("rejects a second pending authorization", async () => {
		const { callbackUrl, server } = await createCallbackServer();
		const authorizationCode = server.waitForAuthorizationCode({
			state: "state",
		});

		await expect(
			server.waitForAuthorizationCode({ state: "other-state" }),
		).rejects.toThrow("A Microsoft sign-in flow is already pending.");

		await requestCallback(callbackUrl("code=authorization-code&state=state"));
		await expect(authorizationCode).resolves.toBe("authorization-code");
	});

	it("times out when a callback never arrives", async () => {
		const { server } = await createCallbackServer(10);

		await expect(
			server.waitForAuthorizationCode({ state: "state" }),
		).rejects.toThrow("Microsoft sign-in timed out.");
	});

	it("fails clearly when the configured callback port is already in use", async () => {
		const { port, server: occupiedServer } = await createOccupiedPortServer();
		const callbackServer = new MicrosoftAuthCallbackServer({
			redirectUri: `http://127.0.0.1:${port}/auth/callback`,
		});

		try {
			await expect(
				callbackServer.waitForAuthorizationCode({ state: "state" }),
			).rejects.toThrow("Microsoft auth callback server failed to start");
		} finally {
			await new Promise<void>((resolve, reject) => {
				occupiedServer.close((error) => (error ? reject(error) : resolve()));
			});
		}
	});
});
