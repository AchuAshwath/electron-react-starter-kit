import { userInfo } from "node:os";
import { z } from "zod";
import type {
	AuthProvider,
	AuthSession,
	AuthSignInRequest,
} from "./auth.types";
import {
	type AuthCredentialStore,
	authCredentialStore,
} from "./auth-credential.store";

export const devAuthProviderId = "dev";

type DevAuthProviderOptions = {
	credentialStore?: Pick<
		AuthCredentialStore,
		"deleteCredential" | "getCredential" | "setCredential"
	>;
	getCurrentUser?: () => { username?: string };
	now?: () => Date;
};

const devAuthCredentialSchema = z.object({
	provider: z.literal(devAuthProviderId),
	strategy: z.literal("device"),
	username: z.string().min(1),
	issuedAt: z.string().min(1),
});

type DevAuthCredential = z.infer<typeof devAuthCredentialSchema>;

export class DevAuthProvider implements AuthProvider {
	readonly id = devAuthProviderId;

	private session: AuthSession | null = null;
	private readonly credentialStore: Pick<
		AuthCredentialStore,
		"deleteCredential" | "getCredential" | "setCredential"
	>;
	private readonly getCurrentUser: () => { username?: string };
	private readonly now: () => Date;

	constructor({
		credentialStore = authCredentialStore,
		getCurrentUser = userInfo,
		now = () => new Date(),
	}: DevAuthProviderOptions = {}) {
		this.credentialStore = credentialStore;
		this.getCurrentUser = getCurrentUser;
		this.now = now;
	}

	async getSession(): Promise<AuthSession | null> {
		if (this.session) {
			return this.session;
		}

		return this.restoreSessionFromCredential();
	}

	async signIn(request: AuthSignInRequest): Promise<AuthSession> {
		if (request.strategy !== "device") {
			throw new Error("Unsupported auth strategy.");
		}

		const username = this.getCurrentUsername();
		const credential: DevAuthCredential = {
			provider: devAuthProviderId,
			strategy: "device",
			username,
			issuedAt: this.now().toISOString(),
		};

		await this.credentialStore.setCredential(
			this.id,
			JSON.stringify(credential),
		);

		this.session = this.createSession(credential);

		return this.session;
	}

	async refreshSession(): Promise<AuthSession | null> {
		this.session = null;
		return this.restoreSessionFromCredential();
	}

	async signOut(): Promise<void> {
		this.session = null;
		await this.credentialStore.deleteCredential(this.id);
	}

	private async restoreSessionFromCredential(): Promise<AuthSession | null> {
		const credentialJson = await this.credentialStore.getCredential(this.id);

		if (!credentialJson) {
			return null;
		}

		const credential = this.parseCredential(credentialJson);

		if (!credential) {
			await this.signOut();
			return null;
		}

		const currentUsername = this.getCurrentUsernameForRestore();

		if (!currentUsername || currentUsername !== credential.username) {
			await this.signOut();
			return null;
		}

		this.session = this.createSession(credential);

		return this.session;
	}

	private getCurrentUsername(): string {
		const username = this.getCurrentUser().username?.trim();

		if (!username) {
			throw new Error("Current device user is unavailable.");
		}

		return username;
	}

	private getCurrentUsernameForRestore(): string | null {
		try {
			return this.getCurrentUser().username?.trim() || null;
		} catch {
			return null;
		}
	}

	private parseCredential(credentialJson: string): DevAuthCredential | null {
		try {
			return devAuthCredentialSchema.parse(JSON.parse(credentialJson));
		} catch {
			return null;
		}
	}

	private createSession(credential: DevAuthCredential): AuthSession {
		return {
			user: {
				id: credential.username,
				name: credential.username,
				username: credential.username,
				provider: devAuthProviderId,
			},
			issuedAt: credential.issuedAt,
		};
	}
}
