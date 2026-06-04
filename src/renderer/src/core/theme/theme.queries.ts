import { queryOptions } from "@tanstack/react-query";
import type { ThemeState } from "./theme.types";

export const themeQueries = {
	all: () => ["theme"] as const,
	current: () =>
		queryOptions({
			queryKey: [...themeQueries.all(), "current"],
			queryFn: (): Promise<ThemeState> => window.api.theme.get(),
		}),
};
