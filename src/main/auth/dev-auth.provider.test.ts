import { describe, expect, it, vi } from "vitest";
import type { AuthSignInRequest } from "./auth.types";
import { DevAuthProvider, devAuthProviderId } from "./dev-auth.provider";

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

const deviceSignInRequest: AuthSignInRequest = { strategy: "device" };

describe("DevAuthProvider", () => {
	it("returns null before sign-in", async () => {
		const credentialStore = createCredentialStore();
		const provider = new DevAuthProvider({ credentialStore });

		await expect(provider.getSession()).resolves.toBeNull();
	});

	it("creates a session from the current OS username", async () => {
		const credentialStore = createCredentialStore();
		const provider = new DevAuthProvider({
			credentialStore,
			getCurrentUser: () => ({ username: "ashwath.n" }),
			now: () => new Date("2026-06-25T10:30:00.000Z"),
		});

		await expect(provider.signIn(deviceSignInRequest)).resolves.toEqual({
			user: {
				id: "ashwath.n",
				name: "ashwath.n",
				username: "ashwath.n",
				provider: devAuthProviderId,
			},
			issuedAt: "2026-06-25T10:30:00.000Z",
		});
	});

	it("stores provider credential metadata on sign-in", async () => {
		const credentialStore = createCredentialStore();
		const provider = new DevAuthProvider({
			credentialStore,
			getCurrentUser: () => ({ username: "ashwath.n" }),
			now: () => new Date("2026-06-25T10:30:00.000Z"),
		});

		await provider.signIn(deviceSignInRequest);

		expect(credentialStore.setCredential).toHaveBeenCalledWith(
			devAuthProviderId,
			JSON.stringify({
				provider: devAuthProviderId,
				strategy: "device",
				username: "ashwath.n",
				issuedAt: "2026-06-25T10:30:00.000Z",
			}),
		);
	});

	it("returns the same in-memory session after sign-in", async () => {
		const credentialStore = createCredentialStore();
		const provider = new DevAuthProvider({
			credentialStore,
			getCurrentUser: () => ({ username: "ashwath.n" }),
		});
		const session = await provider.signIn(deviceSignInRequest);

		await expect(provider.getSession()).resolves.toBe(session);
	});

	it("restores a session from stored credential after provider re-instantiation", async () => {
		const credentialStore = createCredentialStore();
		const firstProvider = new DevAuthProvider({
			credentialStore,
			getCurrentUser: () => ({ username: "ashwath.n" }),
			now: () => new Date("2026-06-25T10:30:00.000Z"),
		});
		await firstProvider.signIn(deviceSignInRequest);
		const restoredProvider = new DevAuthProvider({
			credentialStore,
			getCurrentUser: () => ({ username: "ashwath.n" }),
			now: () => new Date("2026-06-25T10:45:00.000Z"),
		});

		await expect(restoredProvider.getSession()).resolves.toEqual({
			user: {
				id: "ashwath.n",
				name: "ashwath.n",
				username: "ashwath.n",
				provider: devAuthProviderId,
			},
			issuedAt: "2026-06-25T10:30:00.000Z",
		});
	});

	it("refuses restore when the current OS username differs", async () => {
		const credentialStore = createCredentialStore(
			JSON.stringify({
				provider: devAuthProviderId,
				strategy: "device",
				username: "ashwath.n",
				issuedAt: "2026-06-25T10:30:00.000Z",
			}),
		);
		const provider = new DevAuthProvider({
			credentialStore,
			getCurrentUser: () => ({ username: "someone.else" }),
		});

		await expect(provider.getSession()).resolves.toBeNull();
		expect(credentialStore.deleteCredential).toHaveBeenCalledWith(
			devAuthProviderId,
		);
	});

	it("clears corrupt stored credential state", async () => {
		const credentialStore = createCredentialStore("not-json");
		const provider = new DevAuthProvider({
			credentialStore,
			getCurrentUser: () => ({ username: "ashwath.n" }),
		});

		await expect(provider.getSession()).resolves.toBeNull();
		expect(credentialStore.deleteCredential).toHaveBeenCalledWith(
			devAuthProviderId,
		);
	});

	it("returns null and clears stored credential when OS user lookup fails during restore", async () => {
		const credentialStore = createCredentialStore(
			JSON.stringify({
				provider: devAuthProviderId,
				strategy: "device",
				username: "ashwath.n",
				issuedAt: "2026-06-25T10:30:00.000Z",
			}),
		);
		const provider = new DevAuthProvider({
			credentialStore,
			getCurrentUser: vi.fn(() => {
				throw new Error("lookup failed");
			}),
		});

		await expect(provider.getSession()).resolves.toBeNull();
		expect(credentialStore.deleteCredential).toHaveBeenCalledWith(
			devAuthProviderId,
		);
	});

	it("refreshes a valid stored session", async () => {
		const credentialStore = createCredentialStore();
		const provider = new DevAuthProvider({
			credentialStore,
			getCurrentUser: () => ({ username: "ashwath.n" }),
			now: () => new Date("2026-06-25T10:30:00.000Z"),
		});
		await provider.signIn(deviceSignInRequest);
		const refreshingProvider = new DevAuthProvider({
			credentialStore,
			getCurrentUser: () => ({ username: "ashwath.n" }),
			now: () => new Date("2026-06-25T10:50:00.000Z"),
		});

		await expect(refreshingProvider.refreshSession()).resolves.toEqual({
			user: {
				id: "ashwath.n",
				name: "ashwath.n",
				username: "ashwath.n",
				provider: devAuthProviderId,
			},
			issuedAt: "2026-06-25T10:30:00.000Z",
		});
	});

	it("clears in-memory and stored credential state on sign-out", async () => {
		const credentialStore = createCredentialStore();
		const provider = new DevAuthProvider({
			credentialStore,
			getCurrentUser: () => ({ username: "ashwath.n" }),
		});

		await provider.signIn(deviceSignInRequest);
		await provider.signOut();

		await expect(provider.getSession()).resolves.toBeNull();
		expect(credentialStore.deleteCredential).toHaveBeenCalledWith(
			devAuthProviderId,
		);
	});

	it("rejects unsupported sign-in strategies", async () => {
		const credentialStore = createCredentialStore();
		const provider = new DevAuthProvider({
			credentialStore,
			getCurrentUser: () => ({ username: "ashwath.n" }),
		});

		await expect(
			provider.signIn({ strategy: "oauth" } as unknown as AuthSignInRequest),
		).rejects.toThrow("Unsupported auth strategy.");
	});

	it("fails when the OS username is missing", async () => {
		const credentialStore = createCredentialStore();
		const provider = new DevAuthProvider({
			credentialStore,
			getCurrentUser: () => ({ username: "" }),
		});

		await expect(provider.signIn(deviceSignInRequest)).rejects.toThrow(
			"Current device user is unavailable.",
		);
	});

	it("surfaces OS user lookup failures", async () => {
		const credentialStore = createCredentialStore();
		const provider = new DevAuthProvider({
			credentialStore,
			getCurrentUser: vi.fn(() => {
				throw new Error("lookup failed");
			}),
		});

		await expect(provider.signIn(deviceSignInRequest)).rejects.toThrow(
			"lookup failed",
		);
	});
});
