import type { TokenCache } from "@azure/msal-node";
import { describe, expect, it, vi } from "vitest";
import { MicrosoftTokenCacheStore } from "./microsoft-token-cache.store";

function createStorage(initialValue: string | null = null) {
	let value = initialValue;

	return {
		delete: vi.fn(() => {
			value = null;
		}),
		get: vi.fn(() => value),
		set: vi.fn((_key: string, nextValue: string) => {
			value = nextValue;
		}),
		read: () => value,
	};
}

function createTokenCache() {
	return {
		deserialize: vi.fn(),
		serialize: vi.fn(() => "serialized-token-cache"),
	} as unknown as TokenCache;
}

describe("MicrosoftTokenCacheStore", () => {
	it("hydrates a token cache from secure storage", () => {
		const storage = createStorage("serialized-token-cache");
		const tokenCache = createTokenCache();
		const store = new MicrosoftTokenCacheStore({ storage });

		expect(store.hydrateTokenCache(tokenCache)).toBe(true);
		expect(storage.get).toHaveBeenCalledWith("auth:microsoft:token-cache");
		expect(tokenCache.deserialize).toHaveBeenCalledWith(
			"serialized-token-cache",
		);
	});

	it("returns false when no token cache is stored", () => {
		const storage = createStorage();
		const tokenCache = createTokenCache();
		const store = new MicrosoftTokenCacheStore({ storage });

		expect(store.hydrateTokenCache(tokenCache)).toBe(false);
		expect(tokenCache.deserialize).not.toHaveBeenCalled();
	});

	it("clears corrupt token cache state", () => {
		const storage = createStorage("corrupt-cache");
		const tokenCache = createTokenCache();
		vi.mocked(tokenCache.deserialize).mockImplementation(() => {
			throw new Error("bad cache");
		});
		const store = new MicrosoftTokenCacheStore({ storage });

		expect(store.hydrateTokenCache(tokenCache)).toBe(false);
		expect(storage.delete).toHaveBeenCalledWith("auth:microsoft:token-cache");
	});

	it("persists serialized token cache state", () => {
		const storage = createStorage();
		const tokenCache = createTokenCache();
		const store = new MicrosoftTokenCacheStore({ storage });

		store.persistTokenCache(tokenCache);

		expect(storage.set).toHaveBeenCalledWith(
			"auth:microsoft:token-cache",
			"serialized-token-cache",
		);
		expect(storage.read()).toBe("serialized-token-cache");
	});

	it("deletes token cache state", () => {
		const storage = createStorage("serialized-token-cache");
		const store = new MicrosoftTokenCacheStore({ storage });

		store.deleteTokenCache();

		expect(storage.delete).toHaveBeenCalledWith("auth:microsoft:token-cache");
		expect(storage.read()).toBeNull();
	});
});
