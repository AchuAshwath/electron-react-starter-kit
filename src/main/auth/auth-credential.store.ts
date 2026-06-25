import {
	type SecureStorage,
	secureStorage,
} from "../secure-storage/secure-storage";

type AuthCredentialStoreOptions = {
	storage?: Pick<SecureStorage, "delete" | "get" | "set">;
};

export class AuthCredentialStore {
	private readonly storage: Pick<SecureStorage, "delete" | "get" | "set">;

	constructor({ storage = secureStorage }: AuthCredentialStoreOptions = {}) {
		this.storage = storage;
	}

	async getCredential(providerId: string): Promise<string | null> {
		return this.storage.get(this.getCredentialKey(providerId));
	}

	async setCredential(providerId: string, value: string): Promise<void> {
		this.storage.set(this.getCredentialKey(providerId), value);
	}

	async deleteCredential(providerId: string): Promise<void> {
		this.storage.delete(this.getCredentialKey(providerId));
	}

	private getCredentialKey(providerId: string): `auth:${string}:credential` {
		return `auth:${providerId}:credential`;
	}
}

export const authCredentialStore = new AuthCredentialStore();
