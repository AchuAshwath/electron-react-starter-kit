import type { TokenCache } from "@azure/msal-node";
import {
	type SecureStorage,
	secureStorage,
} from "../secure-storage/secure-storage";

const microsoftAuthProviderId = "microsoft";

type MicrosoftTokenCacheStoreOptions = {
	storage?: Pick<SecureStorage, "delete" | "get" | "set">;
};

export class MicrosoftTokenCacheStore {
	private readonly storage: Pick<SecureStorage, "delete" | "get" | "set">;

	constructor({
		storage = secureStorage,
	}: MicrosoftTokenCacheStoreOptions = {}) {
		this.storage = storage;
	}

	hydrateTokenCache(tokenCache: Pick<TokenCache, "deserialize">): boolean {
		const serializedCache = this.storage.get(this.getTokenCacheKey());
		if (!serializedCache) {
			return false;
		}

		try {
			tokenCache.deserialize(serializedCache);
			return true;
		} catch {
			this.deleteTokenCache();
			return false;
		}
	}

	persistTokenCache(tokenCache: Pick<TokenCache, "serialize">): void {
		this.storage.set(this.getTokenCacheKey(), tokenCache.serialize());
	}

	deleteTokenCache(): void {
		this.storage.delete(this.getTokenCacheKey());
	}

	private getTokenCacheKey(): `auth:${string}:token-cache` {
		return `auth:${microsoftAuthProviderId}:token-cache`;
	}
}

export const microsoftTokenCacheStore = new MicrosoftTokenCacheStore();
