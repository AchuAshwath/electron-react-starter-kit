import { describe, expect, it, vi } from "vitest";
import { DevAuthProvider, devAuthProviderId } from "./dev-auth.provider";

describe("DevAuthProvider", () => {
	it("returns null before sign-in", async () => {
		const provider = new DevAuthProvider();

		await expect(provider.getSession()).resolves.toBeNull();
	});

	it("creates a session from the current OS username", async () => {
		const provider = new DevAuthProvider({
			getCurrentUser: () => ({ username: "ashwath.n" }),
			now: () => new Date("2026-06-25T10:30:00.000Z"),
		});

		await expect(provider.signIn()).resolves.toEqual({
			user: {
				id: "ashwath.n",
				name: "ashwath.n",
				username: "ashwath.n",
				provider: devAuthProviderId,
			},
			issuedAt: "2026-06-25T10:30:00.000Z",
		});
	});

	it("returns the same in-memory session after sign-in", async () => {
		const provider = new DevAuthProvider({
			getCurrentUser: () => ({ username: "ashwath.n" }),
		});
		const session = await provider.signIn();

		await expect(provider.getSession()).resolves.toBe(session);
	});

	it("clears the in-memory session on sign-out", async () => {
		const provider = new DevAuthProvider({
			getCurrentUser: () => ({ username: "ashwath.n" }),
		});

		await provider.signIn();
		await provider.signOut();

		await expect(provider.getSession()).resolves.toBeNull();
	});

	it("fails when the OS username is missing", async () => {
		const provider = new DevAuthProvider({
			getCurrentUser: () => ({ username: "" }),
		});

		await expect(provider.signIn()).rejects.toThrow(
			"Current device user is unavailable.",
		);
	});

	it("surfaces OS user lookup failures", async () => {
		const provider = new DevAuthProvider({
			getCurrentUser: vi.fn(() => {
				throw new Error("lookup failed");
			}),
		});

		await expect(provider.signIn()).rejects.toThrow("lookup failed");
	});
});
