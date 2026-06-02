import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

export function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				gcTime: 0,
				retry: false,
			},
		},
	});
}

export function renderWithQueryClient(
	ui: ReactElement,
	options?: RenderOptions,
) {
	const queryClient = createTestQueryClient();

	function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	}

	return {
		queryClient,
		...render(ui, { wrapper: Wrapper, ...options }),
	};
}
