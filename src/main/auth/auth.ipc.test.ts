import { describe, expect, it, vi } from "vitest";
import type { IpcHandlerRegistrar } from "../ipc/ipc-handler";
import { IpcHandlerError } from "../ipc/ipc-handler";
import { authIpcChannels } from "./auth.channels";
import { registerAuthIpcHandlers } from "./auth.ipc";
import type {
	AuthProvider,
	AuthSession,
	AuthSignInRequest,
} from "./auth.types";

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

const signInRequest: AuthSignInRequest = { strategy: "device" };

function createTestRegistrar(providerOverrides: Partial<AuthProvider> = {}) {
	const provider: AuthProvider = {
		id: "dev",
		getSession: vi.fn().mockResolvedValue(session),
		refreshSession: vi.fn().mockResolvedValue(session),
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
			expect.objectContaining({ channel: authIpcChannels.refreshSession }),
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

	it("delegates refresh-session to the provider and logs a safe event", async () => {
		const { handlers, provider } = createTestRegistrar();

		await expect(
			handlers
				.get(authIpcChannels.refreshSession)
				?.handler(undefined, {} as never),
		).resolves.toEqual(session);
		expect(provider.refreshSession).toHaveBeenCalledTimes(1);
		expect(authLoggerMock.info).toHaveBeenCalledWith("Auth session refreshed", {
			provider: "dev",
			signedIn: true,
		});
	});

	it("registers sign-in payload validation", () => {
		const { handlers } = createTestRegistrar();
		const signInHandler = handlers.get(authIpcChannels.signIn);

		expect(signInHandler?.input?.safeParse(signInRequest).success).toBe(true);
		expect(
			signInHandler?.input?.safeParse({ strategy: "microsoft" }).success,
		).toBe(true);
		expect(signInHandler?.input?.safeParse({ strategy: "oauth" }).success).toBe(
			false,
		);
	});

	it("delegates sign-in to the provider and logs a safe session event", async () => {
		const { handlers, provider } = createTestRegistrar();

		await expect(
			handlers.get(authIpcChannels.signIn)?.handler(signInRequest, {} as never),
		).resolves.toEqual(session);
		expect(provider.signIn).toHaveBeenCalledWith(signInRequest);
		expect(authLoggerMock.info).toHaveBeenCalledWith("Auth session created", {
			provider: "dev",
			strategy: "device",
		});
	});

	it("wraps sign-in failures in a renderer-safe IPC error", async () => {
		const { handlers } = createTestRegistrar({
			signIn: vi.fn().mockRejectedValue(new Error("raw OS failure")),
		});

		await expect(
			handlers.get(authIpcChannels.signIn)?.handler(signInRequest, {} as never),
		).rejects.toThrow(IpcHandlerError);
		await expect(
			handlers.get(authIpcChannels.signIn)?.handler(signInRequest, {} as never),
		).rejects.toThrow("INTERNAL_ERROR: Could not create an auth session.");
		expect(authLoggerMock.warn).toHaveBeenCalledWith(
			"Auth session creation failed",
			{
				provider: "dev",
				strategy: "device",
			},
		);
	});

	it("delegates sign-out to the provider and logs a safe session event", async () => {
		const { handlers, provider } = createTestRegistrar();

		await expect(
			handlers.get(authIpcChannels.signOut)?.handler(undefined, {} as never),
		).resolves.toBeUndefined();
		expect(provider.signOut).toHaveBeenCalledTimes(1);
		expect(authLoggerMock.info).toHaveBeenCalledWith("Auth session cleared", {
			provider: "dev",
		});
	});
});
