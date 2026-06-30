import type { AuthenticationResult } from "@azure/msal-node";
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
		redirectUri: `msal${clientId}://auth`,
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

function createTokenResult(
	overrides: Partial<AuthenticationResult> = {},
): AuthenticationResult {
	return {
		accessToken: "access-token",
		account: {
			environment: "login.windows.net",
			homeAccountId: "home-account-id",
			localAccountId: "local-account-id",
			name: "Ashwath N",
			tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
			username: "ashwath.n@example.com",
		},
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

const microsoftSignInRequest: AuthSignInRequest = { strategy: "microsoft" };

describe("MicrosoftAuthProvider", () => {
	it("returns null before sign-in", async () => {
		const credentialStore = createCredentialStore();
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
		});

		await expect(provider.getSession()).resolves.toBeNull();
	});

	it("opens the Microsoft auth URL, exchanges the callback code, and creates a session", async () => {
		const credentialStore = createCredentialStore();
		const msalClient = {
			getAuthCodeUrl: vi.fn(
				async () => "https://login.microsoftonline.com/auth",
			),
			acquireTokenByCode: vi.fn(async () => createTokenResult()),
		};
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
				id: "home-account-id",
				name: "Ashwath N",
				username: "ashwath.n@example.com",
				provider: microsoftAuthProviderId,
			},
			issuedAt: "2026-06-25T10:30:00.000Z",
			expiresAt: "2026-06-25T11:30:00.000Z",
		});
		expect(msalClient.getAuthCodeUrl).toHaveBeenCalledWith({
			codeChallenge: "pkce-challenge",
			codeChallengeMethod: "S256",
			redirectUri: "msal11111111-2222-4333-8444-555555555555://auth",
			scopes: ["openid", "profile", "email", "offline_access", "User.Read"],
			state: "state",
		});
		expect(openExternal).toHaveBeenCalledWith(
			"https://login.microsoftonline.com/auth",
		);
		expect(waitForAuthorizationCode).toHaveBeenCalledWith({ state: "state" });
		expect(callOrder).toEqual(["wait-for-code", "open-external"]);
		expect(msalClient.acquireTokenByCode).toHaveBeenCalledWith({
			code: "authorization-code",
			codeVerifier: "pkce-verifier",
			redirectUri: "msal11111111-2222-4333-8444-555555555555://auth",
			scopes: ["openid", "profile", "email", "offline_access", "User.Read"],
			state: "state",
		});
	});

	it("stores provider credential metadata after sign-in", async () => {
		const credentialStore = createCredentialStore();
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
			msalClient: {
				getAuthCodeUrl: vi.fn(
					async () => "https://login.microsoftonline.com/auth",
				),
				acquireTokenByCode: vi.fn(async () => createTokenResult()),
			},
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
				name: "Ashwath N",
				tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
				username: "ashwath.n@example.com",
				issuedAt: "2026-06-25T10:30:00.000Z",
				expiresAt: "2026-06-25T11:30:00.000Z",
			}),
		);
	});

	it("returns the same in-memory session after sign-in", async () => {
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore: createCredentialStore(),
			msalClient: {
				getAuthCodeUrl: vi.fn(
					async () => "https://login.microsoftonline.com/auth",
				),
				acquireTokenByCode: vi.fn(async () => createTokenResult()),
			},
			createPkceCodes: async () => ({
				challenge: "pkce-challenge",
				verifier: "pkce-verifier",
			}),
			createState: () => "state",
			openExternal: vi.fn(async () => undefined),
			waitForAuthorizationCode: vi.fn(async () => "authorization-code"),
		});
		const session = await provider.signIn(microsoftSignInRequest);

		await expect(provider.getSession()).resolves.toBe(session);
	});

	it("restores a session from stored credential metadata", async () => {
		const credentialStore = createCredentialStore(
			JSON.stringify({
				provider: microsoftAuthProviderId,
				homeAccountId: "home-account-id",
				name: "Ashwath N",
				tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
				username: "ashwath.n@example.com",
				issuedAt: "2026-06-25T10:30:00.000Z",
				expiresAt: "2026-06-25T11:30:00.000Z",
			}),
		);
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
		});

		await expect(provider.getSession()).resolves.toEqual({
			user: {
				id: "home-account-id",
				name: "Ashwath N",
				username: "ashwath.n@example.com",
				provider: microsoftAuthProviderId,
			},
			issuedAt: "2026-06-25T10:30:00.000Z",
			expiresAt: "2026-06-25T11:30:00.000Z",
		});
	});

	it("clears stored credential metadata when tenant does not match config", async () => {
		const credentialStore = createCredentialStore(
			JSON.stringify({
				provider: microsoftAuthProviderId,
				homeAccountId: "home-account-id",
				name: "Ashwath N",
				tenantId: "different-tenant",
				username: "ashwath.n@example.com",
				issuedAt: "2026-06-25T10:30:00.000Z",
			}),
		);
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
		});

		await expect(provider.getSession()).resolves.toBeNull();
		expect(credentialStore.deleteCredential).toHaveBeenCalledWith(
			microsoftAuthProviderId,
		);
	});

	it("clears corrupt stored credential metadata", async () => {
		const credentialStore = createCredentialStore("not-json");
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
		});

		await expect(provider.getSession()).resolves.toBeNull();
		expect(credentialStore.deleteCredential).toHaveBeenCalledWith(
			microsoftAuthProviderId,
		);
	});

	it("refreshes a valid restored session", async () => {
		const credentialStore = createCredentialStore(
			JSON.stringify({
				provider: microsoftAuthProviderId,
				homeAccountId: "home-account-id",
				name: "Ashwath N",
				tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
				username: "ashwath.n@example.com",
				issuedAt: "2026-06-25T10:30:00.000Z",
			}),
		);
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
		});

		await expect(provider.refreshSession()).resolves.toEqual({
			user: {
				id: "home-account-id",
				name: "Ashwath N",
				username: "ashwath.n@example.com",
				provider: microsoftAuthProviderId,
			},
			issuedAt: "2026-06-25T10:30:00.000Z",
		});
	});

	it("clears in-memory and stored credential state on sign-out", async () => {
		const credentialStore = createCredentialStore();
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore,
			msalClient: {
				getAuthCodeUrl: vi.fn(
					async () => "https://login.microsoftonline.com/auth",
				),
				acquireTokenByCode: vi.fn(async () => createTokenResult()),
			},
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
		expect(credentialStore.deleteCredential).toHaveBeenCalledWith(
			microsoftAuthProviderId,
		);
	});

	it("rejects device sign-in because Microsoft auth only supports the Microsoft strategy", async () => {
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore: createCredentialStore(),
		});

		await expect(provider.signIn({ strategy: "device" })).rejects.toThrow(
			"Unsupported auth strategy.",
		);
	});

	it("fails when Microsoft does not return account metadata", async () => {
		const provider = new MicrosoftAuthProvider({
			config: createMicrosoftAuthConfig(),
			credentialStore: createCredentialStore(),
			msalClient: {
				getAuthCodeUrl: vi.fn(
					async () => "https://login.microsoftonline.com/auth",
				),
				acquireTokenByCode: vi.fn(async () =>
					createTokenResult({ account: null }),
				),
			},
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
