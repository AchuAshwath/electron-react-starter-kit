import type {
	AccountInfo,
	AuthenticationResult,
	TokenCache,
} from "@azure/msal-node";
import { describe, expect, it, vi } from "vitest";
import type { MicrosoftAuthConfig } from "../config/app-config";
import type { AuthSignInRequest } from "./auth.types";
import {
	MicrosoftAuthProvider,
	microsoftAuthProviderId,
} from "./microsoft-auth.provider";

function createMicrosoftAuthConfig(): MicrosoftAuthConfig {
	const tenantId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
	const clientId = "11111111-2222-4333-8444-555555555555";

	return {
		authority: new URL(`https://login.microsoftonline.com/${tenantId}`),
		clientId,
		redirectUri: `http://localhost:38987/auth/callback`,
		scopes: ["openid", "profile", "email", "offline_access", "User.Read"],
		tenantId,
	};
}

function createCredentialStore(initialCredential: string | null = null) {
	let credential = initialCredential;
	const store = {
		getCredential: vi.fn(async () => credential),
		setCredential: vi.fn(async (_providerId: string, value: string) => {
			credential = value;
		}),
		deleteCredential: vi.fn(async () => {
			credential = null;
		}),
		read: () => credential,
	};

	return store;
}

function createTokenCacheStore({
	hydrates = true,
}: {
	hydrates?: boolean;
} = {}) {
	return {
		deleteTokenCache: vi.fn(),
		hydrateTokenCache: vi.fn(() => hydrates),
		persistTokenCache: vi.fn(),
	};
}

function createAccount(overrides: Partial<AccountInfo> = {}): AccountInfo {
	return {
		environment: "login.windows.net",
		homeAccountId: "home-account-id",
		localAccountId: "local-account-id",
		name: "Ashwath N",
		tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
		username: "ashwath.n@example.com",
		...overrides,
	};
}

function createTokenResult(
	overrides: Partial<AuthenticationResult> = {},
): AuthenticationResult {
	return {
		accessToken: "access-token",
		account: createAccount(),
		authority: "https://login.microsoftonline.com/tenant",
		cloudGraphHostName: "",
		correlationId: "correlation-id",
		expiresOn: new Date("2026-06-25T11:30:00.000Z"),
		extExpiresOn: new Date("2026-06-25T12:30:00.000Z"),
		familyId: "",
		fromCache: false,
		idToken: "id-token",
		idTokenClaims: {},
		scopes: ["User.Read"],
		state: "state",
		tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
		tokenType: "Bearer",
		uniqueId: "unique-id",
		...overrides,
	};
}

function createTokenCache({
	account = createAccount(),
}: {
	account?: AccountInfo | null;
} = {}) {
	return {
		deserialize: vi.fn(),
		getAccountByHomeId: vi.fn(async () => account),
		serialize: vi.fn(() => "serialized-token-cache"),
	} as unknown as TokenCache;
}

function createMsalClient({
	authCodeUrl = "https://login.microsoftonline.com/auth",
	tokenResult = createTokenResult(),
	silentTokenResult = createTokenResult({ fromCache: true }),
	tokenCache = createTokenCache(),
}: {
	authCodeUrl?: string;
	tokenResult?: AuthenticationResult;
	silentTokenResult?: AuthenticationResult;
	tokenCache?: TokenCache;
} = {}) {
	return {
		acquireTokenByCode: vi.fn(async () => tokenResult),
		acquireTokenSilent: vi.fn(async () => silentTokenResult),
		getAuthCodeUrl: vi.fn(async () => authCodeUrl),
		getTokenCache: vi.fn(() => tokenCache),
	};
}

function createStoredCredential(overrides: Record<string, unknown> = {}) {
	return JSON.stringify({
		provider: microsoftAuthProviderId,
		homeAccountId: "home-account-id",
		tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
		issuedAt: "2026-06-25T10:30:00.000Z",
		expiresAt: "2026-06-25T11:30:00.000Z",
		...overrides,
	});
}

const microsoftSignInRequest: AuthSignInRequest = { strategy: "microsoft" };

describe("MicrosoftAuthProvider", () => {
	it("returns null before sign-in", async () => {
		const credentialStore = createCredentialStore();
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
			msalClient: createMsalClient(),
			tokenCacheStore: createTokenCacheStore(),
		});

		await expect(provider.getSession()).resolves.toBeNull();
	});

	it("opens the Microsoft auth URL, exchanges the callback code, persists cache, and creates a session", async () => {
		const credentialStore = createCredentialStore();
		const tokenCacheStore = createTokenCacheStore();
		const msalClient = createMsalClient();
		const callOrder: string[] = [];
		const openExternal = vi.fn(async () => {
			callOrder.push("open-external");
		});
		const waitForAuthorizationCode = vi.fn(async () => {
			callOrder.push("wait-for-code");
			return "authorization-code";
		});
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
			tokenCacheStore,
			msalClient,
			createPkceCodes: async () => ({
				challenge: "pkce-challenge",
				verifier: "pkce-verifier",
			}),
			createState: () => "state",
			now: () => new Date("2026-06-25T10:30:00.000Z"),
			openExternal,
			waitForAuthorizationCode,
		});

		await expect(provider.signIn(microsoftSignInRequest)).resolves.toEqual({
			user: {
				displayName: "Ashwath N",
				email: "ashwath.n@example.com",
				id: "home-account-id",
				name: "Ashwath N",
				provider: microsoftAuthProviderId,
				providerLabel: "Microsoft 365",
				tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
				username: "ashwath.n@example.com",
			},
			issuedAt: "2026-06-25T10:30:00.000Z",
			expiresAt: "2026-06-25T11:30:00.000Z",
		});
		expect(msalClient.getAuthCodeUrl).toHaveBeenCalledWith({
			codeChallenge: "pkce-challenge",
			codeChallengeMethod: "S256",
			redirectUri: "http://localhost:38987/auth/callback",
			scopes: ["openid", "profile", "email", "offline_access", "User.Read"],
			state: "state",
		});
		expect(openExternal).toHaveBeenCalledWith(
			"https://login.microsoftonline.com/auth",
		);
		expect(waitForAuthorizationCode).toHaveBeenCalledWith({
			signal: expect.any(AbortSignal),
			state: "state",
		});
		expect(callOrder).toEqual(["wait-for-code", "open-external"]);
		expect(msalClient.acquireTokenByCode).toHaveBeenCalledWith({
			code: "authorization-code",
			codeVerifier: "pkce-verifier",
			redirectUri: "http://localhost:38987/auth/callback",
			scopes: ["openid", "profile", "email", "offline_access", "User.Read"],
			state: "state",
		});
		expect(tokenCacheStore.persistTokenCache).toHaveBeenCalledWith(
			msalClient.getTokenCache(),
		);
	});

	it("aborts the pending callback when the browser cannot be opened", async () => {
		const msalClient = createMsalClient();
		let abortSignal: AbortSignal | undefined;
		const waitForAuthorizationCode = vi.fn(
			({ signal }: { signal?: AbortSignal }) => {
				abortSignal = signal;
				return new Promise<string>((_resolve, reject) => {
					signal?.addEventListener("abort", () => {
						reject(new Error("callback aborted"));
					});
				});
			},
		);
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore: createCredentialStore(),
			tokenCacheStore: createTokenCacheStore(),
			msalClient,
			createPkceCodes: async () => ({
				challenge: "pkce-challenge",
				verifier: "pkce-verifier",
			}),
			createState: () => "state",
			openExternal: vi.fn(async () => {
				throw new Error("browser launch failed");
			}),
			waitForAuthorizationCode,
		});

		await expect(provider.signIn(microsoftSignInRequest)).rejects.toThrow(
			"browser launch failed",
		);

		expect(abortSignal?.aborted).toBe(true);
		expect(msalClient.acquireTokenByCode).not.toHaveBeenCalled();
	});
	it("stores provider credential metadata after sign-in", async () => {
		const credentialStore = createCredentialStore();
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
			tokenCacheStore: createTokenCacheStore(),
			msalClient: createMsalClient(),
			createPkceCodes: async () => ({
				challenge: "pkce-challenge",
				verifier: "pkce-verifier",
			}),
			createState: () => "state",
			now: () => new Date("2026-06-25T10:30:00.000Z"),
			openExternal: vi.fn(async () => undefined),
			waitForAuthorizationCode: vi.fn(async () => "authorization-code"),
		});

		await provider.signIn(microsoftSignInRequest);

		expect(credentialStore.setCredential).toHaveBeenCalledWith(
			microsoftAuthProviderId,
			JSON.stringify({
				provider: microsoftAuthProviderId,
				homeAccountId: "home-account-id",
				tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
				issuedAt: "2026-06-25T10:30:00.000Z",
				expiresAt: "2026-06-25T11:30:00.000Z",
			}),
		);
	});

	it("clears partial auth state when sign-in cannot persist the token cache", async () => {
		const credentialStore = createCredentialStore();
		const tokenCacheStore = createTokenCacheStore();
		tokenCacheStore.persistTokenCache.mockImplementation(() => {
			throw new Error("secure storage failed");
		});
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
			tokenCacheStore,
			msalClient: createMsalClient(),
			createPkceCodes: async () => ({
				challenge: "pkce-challenge",
				verifier: "pkce-verifier",
			}),
			createState: () => "state",
			openExternal: vi.fn(async () => undefined),
			waitForAuthorizationCode: vi.fn(async () => "authorization-code"),
		});

		await expect(provider.signIn(microsoftSignInRequest)).rejects.toThrow(
			"secure storage failed",
		);
		expect(tokenCacheStore.deleteTokenCache).toHaveBeenCalled();
		expect(credentialStore.deleteCredential).toHaveBeenCalledWith(
			microsoftAuthProviderId,
		);
	});

	it("returns the same in-memory session after sign-in", async () => {
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore: createCredentialStore(),
			tokenCacheStore: createTokenCacheStore(),
			msalClient: createMsalClient(),
			createPkceCodes: async () => ({
				challenge: "pkce-challenge",
				verifier: "pkce-verifier",
			}),
			createState: () => "state",
			now: () => new Date("2026-06-25T10:30:00.000Z"),
			openExternal: vi.fn(async () => undefined),
			waitForAuthorizationCode: vi.fn(async () => "authorization-code"),
		});
		const session = await provider.signIn(microsoftSignInRequest);

		await expect(provider.getSession()).resolves.toBe(session);
	});

	it("revalidates an expired in-memory session through the token cache", async () => {
		const credentialStore = createCredentialStore();
		const tokenCacheStore = createTokenCacheStore();
		const msalClient = createMsalClient({
			silentTokenResult: createTokenResult({
				fromCache: true,
				expiresOn: new Date("2026-06-25T12:30:00.000Z"),
			}),
		});
		let now = new Date("2026-06-25T10:30:00.000Z");
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
			tokenCacheStore,
			msalClient,
			createPkceCodes: async () => ({
				challenge: "pkce-challenge",
				verifier: "pkce-verifier",
			}),
			createState: () => "state",
			now: () => now,
			openExternal: vi.fn(async () => undefined),
			waitForAuthorizationCode: vi.fn(async () => "authorization-code"),
		});

		await provider.signIn(microsoftSignInRequest);
		now = new Date("2026-06-25T11:31:00.000Z");

		await expect(provider.getSession()).resolves.toEqual({
			user: {
				displayName: "Ashwath N",
				email: "ashwath.n@example.com",
				id: "home-account-id",
				name: "Ashwath N",
				provider: microsoftAuthProviderId,
				providerLabel: "Microsoft 365",
				tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
				username: "ashwath.n@example.com",
			},
			issuedAt: "2026-06-25T11:31:00.000Z",
			expiresAt: "2026-06-25T12:30:00.000Z",
		});
		expect(msalClient.acquireTokenSilent).toHaveBeenCalled();
	});

	it("restores a session by hydrating the token cache and acquiring a token silently", async () => {
		const credentialStore = createCredentialStore(createStoredCredential());
		const tokenCacheStore = createTokenCacheStore();
		const msalClient = createMsalClient({
			silentTokenResult: createTokenResult({
				fromCache: true,
				expiresOn: new Date("2026-06-25T12:30:00.000Z"),
			}),
		});
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
			tokenCacheStore,
			msalClient,
			now: () => new Date("2026-06-25T12:00:00.000Z"),
		});

		await expect(provider.getSession()).resolves.toEqual({
			user: {
				displayName: "Ashwath N",
				email: "ashwath.n@example.com",
				id: "home-account-id",
				name: "Ashwath N",
				provider: microsoftAuthProviderId,
				providerLabel: "Microsoft 365",
				tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
				username: "ashwath.n@example.com",
			},
			issuedAt: "2026-06-25T12:00:00.000Z",
			expiresAt: "2026-06-25T12:30:00.000Z",
		});
		expect(tokenCacheStore.hydrateTokenCache).toHaveBeenCalledWith(
			msalClient.getTokenCache(),
		);
		expect(msalClient.acquireTokenSilent).toHaveBeenCalledWith({
			account: createAccount(),
			scopes: ["openid", "profile", "email", "offline_access", "User.Read"],
		});
		expect(tokenCacheStore.persistTokenCache).toHaveBeenCalledWith(
			msalClient.getTokenCache(),
		);
	});

	it("clears stored auth state when no token cache is available", async () => {
		const credentialStore = createCredentialStore(createStoredCredential());
		const tokenCacheStore = createTokenCacheStore({ hydrates: false });
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
			tokenCacheStore,
			msalClient: createMsalClient(),
		});

		await expect(provider.getSession()).resolves.toBeNull();
		expect(tokenCacheStore.deleteTokenCache).toHaveBeenCalled();
		expect(credentialStore.deleteCredential).toHaveBeenCalledWith(
			microsoftAuthProviderId,
		);
	});

	it("clears stored auth state when silent token acquisition fails", async () => {
		const credentialStore = createCredentialStore(createStoredCredential());
		const tokenCacheStore = createTokenCacheStore();
		const msalClient = createMsalClient();
		msalClient.acquireTokenSilent.mockRejectedValue(
			new Error("interaction required"),
		);
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
			tokenCacheStore,
			msalClient,
		});

		await expect(provider.getSession()).resolves.toBeNull();
		expect(tokenCacheStore.deleteTokenCache).toHaveBeenCalled();
		expect(credentialStore.deleteCredential).toHaveBeenCalledWith(
			microsoftAuthProviderId,
		);
	});

	it("clears stored credential metadata when tenant does not match config", async () => {
		const credentialStore = createCredentialStore(
			createStoredCredential({ tenantId: "different-tenant" }),
		);
		const tokenCacheStore = createTokenCacheStore();
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
			tokenCacheStore,
			msalClient: createMsalClient(),
		});

		await expect(provider.getSession()).resolves.toBeNull();
		expect(tokenCacheStore.deleteTokenCache).toHaveBeenCalled();
		expect(credentialStore.deleteCredential).toHaveBeenCalledWith(
			microsoftAuthProviderId,
		);
	});

	it("clears corrupt stored credential metadata", async () => {
		const credentialStore = createCredentialStore("not-json");
		const tokenCacheStore = createTokenCacheStore();
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
			tokenCacheStore,
			msalClient: createMsalClient(),
		});

		await expect(provider.getSession()).resolves.toBeNull();
		expect(tokenCacheStore.deleteTokenCache).toHaveBeenCalled();
		expect(credentialStore.deleteCredential).toHaveBeenCalledWith(
			microsoftAuthProviderId,
		);
	});

	it("refreshes by forcing token-cache-backed session validation", async () => {
		const credentialStore = createCredentialStore(createStoredCredential());
		const tokenCacheStore = createTokenCacheStore();
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
			tokenCacheStore,
			msalClient: createMsalClient(),
			now: () => new Date("2026-06-25T12:00:00.000Z"),
		});

		await expect(provider.refreshSession()).resolves.toEqual({
			user: {
				displayName: "Ashwath N",
				email: "ashwath.n@example.com",
				id: "home-account-id",
				name: "Ashwath N",
				provider: microsoftAuthProviderId,
				providerLabel: "Microsoft 365",
				tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
				username: "ashwath.n@example.com",
			},
			issuedAt: "2026-06-25T12:00:00.000Z",
			expiresAt: "2026-06-25T11:30:00.000Z",
		});
	});

	it("clears in-memory, token cache, and stored credential state on sign-out", async () => {
		const credentialStore = createCredentialStore();
		const tokenCacheStore = createTokenCacheStore();
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
			tokenCacheStore,
			msalClient: createMsalClient(),
			createPkceCodes: async () => ({
				challenge: "pkce-challenge",
				verifier: "pkce-verifier",
			}),
			createState: () => "state",
			openExternal: vi.fn(async () => undefined),
			waitForAuthorizationCode: vi.fn(async () => "authorization-code"),
		});

		await provider.signIn(microsoftSignInRequest);
		await provider.signOut();

		await expect(provider.getSession()).resolves.toBeNull();
		expect(tokenCacheStore.deleteTokenCache).toHaveBeenCalled();
		expect(credentialStore.deleteCredential).toHaveBeenCalledWith(
			microsoftAuthProviderId,
		);
	});

	it("rejects non-Microsoft sign-in requests at runtime", async () => {
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore: createCredentialStore(),
			tokenCacheStore: createTokenCacheStore(),
			msalClient: createMsalClient(),
		});

		await expect(
			provider.signIn({ strategy: "device" } as unknown as AuthSignInRequest),
		).rejects.toThrow("Unsupported auth strategy.");
	});

	it("fails when Microsoft does not return account metadata", async () => {
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore: createCredentialStore(),
			tokenCacheStore: createTokenCacheStore(),
			msalClient: createMsalClient({
				tokenResult: createTokenResult({ account: null }),
			}),
			createPkceCodes: async () => ({
				challenge: "pkce-challenge",
				verifier: "pkce-verifier",
			}),
			createState: () => "state",
			openExternal: vi.fn(async () => undefined),
			waitForAuthorizationCode: vi.fn(async () => "authorization-code"),
		});

		await expect(provider.signIn(microsoftSignInRequest)).rejects.toThrow(
			"Microsoft auth did not return an account.",
		);
	});
});
