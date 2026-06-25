import { userInfo } from "node:os";
import type { AuthProvider, AuthSession } from "./auth.types";

export const devAuthProviderId = "dev";

type DevAuthProviderOptions = {
	getCurrentUser?: () => { username?: string };
	now?: () => Date;
};

export class DevAuthProvider implements AuthProvider {
	private session: AuthSession | null = null;
	private readonly getCurrentUser: () => { username?: string };
	private readonly now: () => Date;

	constructor({
		getCurrentUser = userInfo,
		now = () => new Date(),
	}: DevAuthProviderOptions = {}) {
		this.getCurrentUser = getCurrentUser;
		this.now = now;
	}

	async getSession(): Promise<AuthSession | null> {
		return this.session;
	}

	async signIn(): Promise<AuthSession> {
		const username = this.getCurrentUser().username?.trim();

		if (!username) {
			throw new Error("Current device user is unavailable.");
		}

		const session: AuthSession = {
			user: {
				id: username,
				name: username,
				username,
				provider: devAuthProviderId,
			},
			issuedAt: this.now().toISOString(),
		};

		this.session = session;

		return session;
	}

	async signOut(): Promise<void> {
		this.session = null;
	}
}
