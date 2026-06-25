import { describe, expect, it, vi } from "vitest";
import { AuthCredentialStore } from "./auth-credential.store";

function createTestStore() {
	const values = new Map<string, string>();
	const storage = {
		get: vi.fn((key: string) => values.get(key) ?? null),
		set: vi.fn((key: string, value: string) => {
			values.set(key, value);
		}),
		delete: vi.fn((key: string) => {
			values.delete(key);
		}),
	};
	const store = new AuthCredentialStore({ storage });

	return { storage, store, values };
}

describe("AuthCredentialStore", () => {
	it("namespaces credentials by provider", async () => {
		const { store, values } = createTestStore();

		await store.setCredential("dev", "dev-secret");
		await store.setCredential("google", "google-secret");

		expect(values.get("auth:dev:credential")).toBe("dev-secret");
		expect(values.get("auth:google:credential")).toBe("google-secret");
	});

	it("stores and reads provider credentials", async () => {
		const { storage, store } = createTestStore();

		await store.setCredential("dev", "secret-value");

		await expect(store.getCredential("dev")).resolves.toBe("secret-value");
		expect(storage.get).toHaveBeenCalledWith("auth:dev:credential");
	});

	it("deletes provider credentials without exposing encrypted storage details", async () => {
		const { storage, store } = createTestStore();

		await store.setCredential("dev", "secret-value");
		await store.deleteCredential("dev");

		await expect(store.getCredential("dev")).resolves.toBeNull();
		expect(storage.delete).toHaveBeenCalledWith("auth:dev:credential");
	});
});
