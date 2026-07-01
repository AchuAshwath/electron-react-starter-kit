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
		displayName: "Ashwath N",
		email: "ashwath.n@example.com",
		id: "home-account-id",
		name: "Ashwath N",
		provider: "microsoft",
		providerLabel: "Microsoft 365",
		tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
		username: "ashwath.n@example.com",
	},
	issuedAt: "2026-06-25T10:30:00.000Z",
};

const signInRequest: AuthSignInRequest = { strategy: "microsoft" };

function createTestRegistrar(providerOverrides: Partial<AuthProvider> = {}) {
	const provider: AuthProvider = {
		id: "microsoft",
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
			provider: "microsoft",
			signedIn: true,
		});
	});

	it("registers Microsoft-only sign-in payload validation", () => {
		const { handlers } = createTestRegistrar();
		const signInHandler = handlers.get(authIpcChannels.signIn);

		expect(signInHandler?.input?.safeParse(signInRequest).success).toBe(true);
		expect(
			signInHandler?.input?.safeParse({ strategy: "device" }).success,
		).toBe(false);
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
			provider: "microsoft",
			strategy: "microsoft",
		});
	});

	it("wraps sign-in failures in a renderer-safe IPC error", async () => {
		const { handlers } = createTestRegistrar({
			signIn: vi.fn().mockRejectedValue(new Error("raw provider failure")),
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
				provider: "microsoft",
				strategy: "microsoft",
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
			provider: "microsoft",
		});
	});
});
