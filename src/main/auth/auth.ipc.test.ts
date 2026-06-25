import { describe, expect, it, vi } from "vitest";
import type { IpcHandlerRegistrar } from "../ipc/ipc-handler";
import { IpcHandlerError } from "../ipc/ipc-handler";
import { authIpcChannels } from "./auth.channels";
import { registerAuthIpcHandlers } from "./auth.ipc";
import type { AuthProvider, AuthSession } from "./auth.types";

const authLoggerMock = vi.hoisted(() => ({
	info: vi.fn(),
	warn: vi.fn(),
}));

vi.mock("../logging/logger", () => ({
	authLogger: authLoggerMock,
}));

const session: AuthSession = {
	user: {
		id: "ashwath.n",
		name: "ashwath.n",
		username: "ashwath.n",
		provider: "dev",
	},
	issuedAt: "2026-06-25T10:30:00.000Z",
};

function createTestRegistrar(providerOverrides: Partial<AuthProvider> = {}) {
	const provider: AuthProvider = {
		getSession: vi.fn().mockResolvedValue(session),
		signIn: vi.fn().mockResolvedValue(session),
		signOut: vi.fn().mockResolvedValue(undefined),
		...providerOverrides,
	};
	const handlers = new Map<string, Parameters<IpcHandlerRegistrar>[0]>();
	const registerIpcHandler: IpcHandlerRegistrar = vi.fn((options) => {
		handlers.set(options.channel, options);
	});

	registerAuthIpcHandlers(registerIpcHandler, { provider });

	return {
		handlers,
		provider,
		registerIpcHandler,
	};
}

describe("registerAuthIpcHandlers", () => {
	it("registers all auth channels", () => {
		const { registerIpcHandler } = createTestRegistrar();

		expect(registerIpcHandler).toHaveBeenCalledWith(
			expect.objectContaining({ channel: authIpcChannels.getSession }),
		);
		expect(registerIpcHandler).toHaveBeenCalledWith(
			expect.objectContaining({ channel: authIpcChannels.signIn }),
		);
		expect(registerIpcHandler).toHaveBeenCalledWith(
			expect.objectContaining({ channel: authIpcChannels.signOut }),
		);
	});

	it("delegates get-session to the provider", async () => {
		const { handlers, provider } = createTestRegistrar();

		await expect(
			handlers.get(authIpcChannels.getSession)?.handler(undefined, {} as never),
		).resolves.toEqual(session);
		expect(provider.getSession).toHaveBeenCalledTimes(1);
	});

	it("delegates sign-in to the provider and logs a safe session event", async () => {
		const { handlers, provider } = createTestRegistrar();

		await expect(
			handlers.get(authIpcChannels.signIn)?.handler(undefined, {} as never),
		).resolves.toEqual(session);
		expect(provider.signIn).toHaveBeenCalledTimes(1);
		expect(authLoggerMock.info).toHaveBeenCalledWith("Auth session created", {
			provider: "dev",
		});
	});

	it("wraps sign-in failures in a renderer-safe IPC error", async () => {
		const { handlers } = createTestRegistrar({
			signIn: vi.fn().mockRejectedValue(new Error("raw OS failure")),
		});

		await expect(
			handlers.get(authIpcChannels.signIn)?.handler(undefined, {} as never),
		).rejects.toThrow(IpcHandlerError);
		await expect(
			handlers.get(authIpcChannels.signIn)?.handler(undefined, {} as never),
		).rejects.toThrow("INTERNAL_ERROR: Could not create an auth session.");
		expect(authLoggerMock.warn).toHaveBeenCalledWith(
			"Auth session creation failed",
		);
	});

	it("delegates sign-out to the provider and logs a safe session event", async () => {
		const { handlers, provider } = createTestRegistrar();

		await expect(
			handlers.get(authIpcChannels.signOut)?.handler(undefined, {} as never),
		).resolves.toBeUndefined();
		expect(provider.signOut).toHaveBeenCalledTimes(1);
		expect(authLoggerMock.info).toHaveBeenCalledWith("Auth session cleared");
	});
});
