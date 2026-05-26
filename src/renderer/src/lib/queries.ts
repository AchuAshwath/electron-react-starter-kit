import { queryOptions } from "@tanstack/react-query";

/**
 * Query options for the Electron app version.
 * Uses staleTime: Infinity because the version never changes during a session.
 */
export const appVersionQueryOptions = queryOptions({
	queryKey: ["app", "version"],
	queryFn: () => window.api.getAppVersion(),
	staleTime: Number.POSITIVE_INFINITY,
});

/**
 * Query options for system info (platform, arch, runtime versions).
 * Uses staleTime: Infinity — system info is static for the app's lifetime.
 */
export const systemInfoQueryOptions = queryOptions({
	queryKey: ["app", "system-info"],
	queryFn: () => window.api.getSystemInfo(),
	staleTime: Number.POSITIVE_INFINITY,
});
