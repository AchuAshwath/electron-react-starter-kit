import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthSession } from "../../../../main/auth/auth.types";
import { useRefreshSession, useSignIn, useSignOut } from "./auth.hooks";
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

function createWrapper(queryClient: QueryClient) {
	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};
}

describe("auth hooks", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		Object.defineProperty(window, "api", {
			configurable: true,
			value: apiMock,
		});
	});

	it("writes the signed-in session to the query cache", async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		apiMock.auth.signIn.mockResolvedValue(session);
		const { result } = renderHook(() => useSignIn(), {
			wrapper: createWrapper(queryClient),
		});

		result.current.mutate();

		await waitFor(() => {
			expect(queryClient.getQueryData(authQueries.session().queryKey)).toEqual(
				session,
			);
		});
		expect(apiMock.auth.signIn).toHaveBeenCalledWith({ strategy: "device" });
	});

	it("writes the refreshed session to the query cache", async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		apiMock.auth.refreshSession.mockResolvedValue(session);
		const { result } = renderHook(() => useRefreshSession(), {
			wrapper: createWrapper(queryClient),
		});

		result.current.mutate();

		await waitFor(() => {
			expect(queryClient.getQueryData(authQueries.session().queryKey)).toEqual(
				session,
			);
		});
	});

	it("clears the session query cache when refresh returns null", async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		queryClient.setQueryData(authQueries.session().queryKey, session);
		apiMock.auth.refreshSession.mockResolvedValue(null);
		const { result } = renderHook(() => useRefreshSession(), {
			wrapper: createWrapper(queryClient),
		});

		result.current.mutate();

		await waitFor(() => {
			expect(
				queryClient.getQueryData(authQueries.session().queryKey),
			).toBeNull();
		});
	});

	it("clears the session query cache on sign-out", async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		queryClient.setQueryData(authQueries.session().queryKey, session);
		apiMock.auth.signOut.mockResolvedValue(undefined);
		const { result } = renderHook(() => useSignOut(), {
			wrapper: createWrapper(queryClient),
		});

		result.current.mutate();

		await waitFor(() => {
			expect(
				queryClient.getQueryData(authQueries.session().queryKey),
			).toBeNull();
		});
	});
});
