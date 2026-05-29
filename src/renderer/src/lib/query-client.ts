import { QueryClient } from "@tanstack/react-query";

/**
 * Global QueryClient instance — created once at module level.
 *
 * Never instantiate a QueryClient inside a React component,
 * or every re-render will wipe your cache.
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Data is fresh for 30s; no background re-fetch during this window
			staleTime: 30 * 1000,
			// Keep unused cached data for 5 minutes before garbage collecting
			gcTime: 5 * 60 * 1000,
			// Retry once on failure (IPC errors are usually transient)
			retry: 1,
		},
	},
});
