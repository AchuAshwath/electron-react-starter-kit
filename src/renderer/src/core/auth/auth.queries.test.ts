import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthSession } from "../../../../main/auth/auth.types";
import { authQueries } from "./auth.queries";

const session: AuthSession = {
	user: {
		id: "ashwath.n",
		name: "ashwath.n",
		username: "ashwath.n",
		provider: "dev",
	},
	issuedAt: "2026-06-25T10:30:00.000Z",
};

const apiMock = {
	auth: {
		getSession: vi.fn<Window["api"]["auth"]["getSession"]>(),
		refreshSession: vi.fn<Window["api"]["auth"]["refreshSession"]>(),
		signIn: vi.fn<Window["api"]["auth"]["signIn"]>(),
		signOut: vi.fn<Window["api"]["auth"]["signOut"]>(),
	},
};

describe("authQueries", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		Object.defineProperty(window, "api", {
			configurable: true,
			value: apiMock,
		});
	});

	it("builds hierarchical query keys", () => {
		expect(authQueries.all()).toEqual(["auth"]);
		expect(authQueries.session().queryKey).toEqual(["auth", "session"]);
	});

	it("fetches the current session through the preload bridge", async () => {
		apiMock.auth.getSession.mockResolvedValue(session);

		const queryFn = authQueries.session()
			.queryFn as () => Promise<AuthSession | null>;

		await expect(queryFn()).resolves.toEqual(session);
		expect(apiMock.auth.getSession).toHaveBeenCalledTimes(1);
	});
});
