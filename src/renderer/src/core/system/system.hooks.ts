import { useQuery } from "@tanstack/react-query";
import { systemQueries } from "./system.queries";

/**
 * Hook: fetch the Electron app version from the main process.
 *
 * For simple cases you can skip this hook entirely and call
 *   useQuery(systemQueries.version())
 * directly in your component. This wrapper exists so you have
 * a place to add transforms, selectors, or extra logic later.
 */
export const useAppVersion = () => {
	return useQuery(systemQueries.version());
};

/**
 * Hook: fetch system info (platform, arch, runtime versions).
 */
export const useSystemInfo = () => {
	return useQuery(systemQueries.info());
};
