import { queryOptions } from "@tanstack/react-query";

export const authQueries = {
	all: () => ["auth"] as const,

	session: () =>
		queryOptions({
			queryKey: [...authQueries.all(), "session"],
			queryFn: () => window.api.auth.getSession(),
			staleTime: Number.POSITIVE_INFINITY,
		}),
};
