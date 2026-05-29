import { queryOptions } from "@tanstack/react-query";

/**
 * Query factory for system-level IPC queries (TkDodo pattern).
 *
 * Each method returns a queryOptions object that bundles:
 *   - queryKey (hierarchical, from generic → specific)
 *   - queryFn  (the IPC bridge call)
 *   - staleTime / other config
 *
 * Usage in components:
 *   const { data } = useQuery(systemQueries.version());
 *
 * Usage in route loaders:
 *   queryClient.ensureQueryData(systemQueries.version());
 *
 * Invalidate everything:
 *   queryClient.invalidateQueries({ queryKey: systemQueries.all() });
 */
export const systemQueries = {
	/** Base key for all system queries — useful for bulk invalidation */
	all: () => ["system"] as const,

	/** Fetch the Electron app version from the main process */
	version: () =>
		queryOptions({
			queryKey: [...systemQueries.all(), "version"],
			queryFn: () => window.api.getAppVersion(),
			staleTime: Number.POSITIVE_INFINITY, // Version never changes during a session
		}),

	/** Fetch platform, arch, and runtime versions from the main process */
	info: () =>
		queryOptions({
			queryKey: [...systemQueries.all(), "info"],
			queryFn: () => window.api.getSystemInfo(),
			staleTime: Number.POSITIVE_INFINITY, // System info is static for the app's lifetime
		}),
};
