import { queryOptions } from "@tanstack/react-query";

export const settingsQueries = {
	all: () => ["settings"] as const,

	current: () =>
		queryOptions({
			queryKey: [...settingsQueries.all(), "current"],
			queryFn: () => window.api.settings.get(),
			staleTime: Number.POSITIVE_INFINITY,
		}),
};
