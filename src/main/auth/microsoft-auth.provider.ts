import {
	type AuthenticationResult,
	type AuthorizationCodeRequest,
	type AuthorizationUrlRequest,
	CryptoProvider,
	PublicClientApplication,
	type TokenCache,
} from "@azure/msal-node";
import { shell } from "electron";
import { z } from "zod";
import type { MicrosoftAuthConfig } from "../config/app-config";
import type {
	AuthProvider,
	AuthSession,
	AuthSignInRequest,
} from "./auth.types";
import {
	type AuthCredentialStore,
	authCredentialStore,
} from "./auth-credential.store";
import {
	type MicrosoftTokenCacheStore,
	microsoftTokenCacheStore,
} from "./microsoft-token-cache.store";

export const microsoftAuthProviderId = "microsoft";
const microsoftAuthProviderLabel = "Microsoft 365";

type MicrosoftAuthClient = Pick<
	PublicClientApplication,
	| "acquireTokenByCode"
	| "acquireTokenSilent"
	| "getAuthCodeUrl"
	| "getTokenCache"
>;

type PkceCodes = {
	challenge: string;
	verifier: string;
};

type WaitForAuthorizationCodeRequest = {
	signal?: AbortSignal;
	state: string;
};

type MicrosoftAuthProviderOptions = {
	config: MicrosoftAuthConfig;
	credentialStore?: Pick<
		AuthCredentialStore,
		"deleteCredential" | "getCredential" | "setCredential"
	>;
	tokenCacheStore?: Pick<
		MicrosoftTokenCacheStore,
		"deleteTokenCache" | "hydrateTokenCache" | "persistTokenCache"
	>;
	msalClient?: MicrosoftAuthClient;
	createPkceCodes?: () => Promise<PkceCodes>;
	createState?: () => string;
	now?: () => Date;
	openExternal?: (url: string) => Promise<void>;
	waitForAuthorizationCode?: (
		request: WaitForAuthorizationCodeRequest,
	) => Promise<string>;
};

const microsoftCredentialSchema = z.object({
	provider: z.literal(microsoftAuthProviderId),
	homeAccountId: z.string().min(1),
	tenantId: z.string().min(1),
	issuedAt: z.string().min(1),
	expiresAt: z.string().min(1).optional(),
});

type MicrosoftCredential = z.infer<typeof microsoftCredentialSchema>;

export class MicrosoftAuthProvider implements AuthProvider {
	readonly id = microsoftAuthProviderId;

	private readonly config: MicrosoftAuthConfig;
	private readonly credentialStore: Pick<
		AuthCredentialStore,
		"deleteCredential" | "getCredential" | "setCredential"
	>;
	private readonly tokenCacheStore: Pick<
		MicrosoftTokenCacheStore,
		"deleteTokenCache" | "hydrateTokenCache" | "persistTokenCache"
	>;
	private readonly msalClient: MicrosoftAuthClient;
	private readonly createPkceCodes: () => Promise<PkceCodes>;
	private readonly createState: () => string;
	private readonly now: () => Date;
	private readonly openExternal: (url: string) => Promise<void>;
	private readonly waitForAuthorizationCode: (
		request: WaitForAuthorizationCodeRequest,
	) => Promise<string>;
	private session: AuthSession | null = null;

	constructor({
		config,
		credentialStore = authCredentialStore,
		tokenCacheStore = microsoftTokenCacheStore,
		msalClient,
		createPkceCodes,
		createState,
		now = () => new Date(),
		openExternal = (url) => shell.openExternal(url),
		waitForAuthorizationCode,
	}: MicrosoftAuthProviderOptions) {
		this.config = config;
		this.credentialStore = credentialStore;
		this.tokenCacheStore = tokenCacheStore;
		this.msalClient =
			msalClient ??
			new PublicClientApplication({
				auth: {
					authority: config.authority.toString().replace(/\/$/, ""),
					clientId: config.clientId,
				},
			});
		this.createPkceCodes =
			createPkceCodes ??
			(async () => {
				const cryptoProvider = new CryptoProvider();
				return cryptoProvider.generatePkceCodes();
			});
		this.createState =
			createState ??
			(() => {
				const cryptoProvider = new CryptoProvider();
				return cryptoProvider.createNewGuid();
			});
		this.now = now;
		this.openExternal = openExternal;
		this.waitForAuthorizationCode =
			waitForAuthorizationCode ??
			(async () => {
				throw new Error("Microsoft auth callback handling is not configured.");
			});
	}

	async getSession(): Promise<AuthSession | null> {
		if (this.session && !this.isSessionExpired(this.session)) {
			return this.session;
		}

		return this.restoreSession();
	}

	async signIn(request: AuthSignInRequest): Promise<AuthSession> {
		if (request.strategy !== "microsoft") {
			throw new Error("Unsupported auth strategy.");
		}

		const state = this.createState();
		const pkceCodes = await this.createPkceCodes();
		const authUrl = await this.msalClient.getAuthCodeUrl(
			this.createAuthorizationUrlRequest(state, pkceCodes.challenge),
		);

		const callbackAbortController = new AbortController();
		const authorizationCode = this.waitForAuthorizationCode({
			signal: callbackAbortController.signal,
			state,
		});

		try {
			await this.openExternal(authUrl);
		} catch (error) {
			callbackAbortController.abort();
			await authorizationCode.catch(() => undefined);
			throw error;
		}

		const code = await authorizationCode;
		const tokenResult = await this.msalClient.acquireTokenByCode(
			this.createAuthorizationCodeRequest(code, state, pkceCodes.verifier),
		);
		const session = this.createSessionFromTokenResult(tokenResult);

		try {
			this.tokenCacheStore.persistTokenCache(this.getTokenCache());
			await this.credentialStore.setCredential(
				microsoftAuthProviderId,
				JSON.stringify(this.createCredentialFromSession(session)),
			);
		} catch (error) {
			this.tokenCacheStore.deleteTokenCache();
			await this.credentialStore.deleteCredential(microsoftAuthProviderId);
			throw error;
		}

		this.session = session;
		return session;
	}

	async refreshSession(): Promise<AuthSession | null> {
		return this.restoreSession();
	}

	async signOut(): Promise<void> {
		this.session = null;
		this.tokenCacheStore.deleteTokenCache();
		await this.credentialStore.deleteCredential(microsoftAuthProviderId);
	}

	private createAuthorizationUrlRequest(
		state: string,
		codeChallenge: string,
	): AuthorizationUrlRequest {
		return {
			codeChallenge,
			codeChallengeMethod: "S256",
			redirectUri: this.config.redirectUri,
			scopes: this.config.scopes,
			state,
		};
	}

	private createAuthorizationCodeRequest(
		code: string,
		state: string,
		codeVerifier: string,
	): AuthorizationCodeRequest {
		return {
			code,
			codeVerifier,
			redirectUri: this.config.redirectUri,
			scopes: this.config.scopes,
			state,
		};
	}

	private createSessionFromTokenResult(
		tokenResult: AuthenticationResult,
	): AuthSession {
		const account = tokenResult.account;
		if (!account) {
			throw new Error("Microsoft auth did not return an account.");
		}

		const username = account.username?.trim() || undefined;
		const displayName = account.name?.trim() || username;
		const id = account.homeAccountId?.trim() || account.localAccountId?.trim();
		const tenantId = account.tenantId?.trim() || this.config.tenantId;

		if (!id || !displayName) {
			throw new Error("Microsoft account metadata is incomplete.");
		}

		return {
			user: {
				displayName,
				email: username,
				id,
				name: displayName,
				provider: microsoftAuthProviderId,
				providerLabel: microsoftAuthProviderLabel,
				tenantId,
				username,
			},
			issuedAt: this.now().toISOString(),
			expiresAt: tokenResult.expiresOn?.toISOString(),
		};
	}

	private createCredentialFromSession(
		session: AuthSession,
	): MicrosoftCredential {
		return {
			provider: microsoftAuthProviderId,
			homeAccountId: session.user.id,
			tenantId: session.user.tenantId ?? this.config.tenantId,
			issuedAt: session.issuedAt,
			expiresAt: session.expiresAt,
		};
	}

	private isSessionExpired(session: AuthSession): boolean {
		if (!session.expiresAt) {
			return false;
		}

		return new Date(session.expiresAt).getTime() <= this.now().getTime();
	}

	private async restoreSession(): Promise<AuthSession | null> {
		const storedCredential = await this.credentialStore.getCredential(
			microsoftAuthProviderId,
		);

		if (!storedCredential) {
			return null;
		}

		try {
			const credential = microsoftCredentialSchema.parse(
				JSON.parse(storedCredential),
			);

			if (credential.tenantId !== this.config.tenantId) {
				await this.clearStoredAuthState();
				return null;
			}

			const tokenCache = this.getTokenCache();
			const hasTokenCache = this.tokenCacheStore.hydrateTokenCache(tokenCache);
			if (!hasTokenCache) {
				await this.clearStoredAuthState();
				return null;
			}

			const account = await tokenCache.getAccountByHomeId(
				credential.homeAccountId,
			);
			if (!account) {
				await this.clearStoredAuthState();
				return null;
			}

			const tokenResult = await this.msalClient.acquireTokenSilent({
				account,
				scopes: this.config.scopes,
			});
			const session = this.createSessionFromTokenResult(tokenResult);

			this.tokenCacheStore.persistTokenCache(tokenCache);
			this.session = session;
			return session;
		} catch {
			await this.clearStoredAuthState();
			return null;
		}
	}

	private getTokenCache(): TokenCache {
		return this.msalClient.getTokenCache();
	}

	private async clearStoredAuthState(): Promise<void> {
		this.session = null;
		this.tokenCacheStore.deleteTokenCache();
		await this.credentialStore.deleteCredential(microsoftAuthProviderId);
	}
}
