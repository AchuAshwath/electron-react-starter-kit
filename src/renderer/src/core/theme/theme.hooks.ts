import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { settingsQueries } from "../settings/settings.queries";
import { themeQueries } from "./theme.queries";
import type { ThemePreference, ThemeState } from "./theme.types";

export function useTheme() {
	return useQuery(themeQueries.current());
}

export function useSetThemePreference() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (theme: ThemePreference) =>
			window.api.theme.setPreference(theme),
		onSuccess: (themeState) => {
			queryClient.setQueryData(themeQueries.current().queryKey, themeState);
			queryClient.setQueryData(
				settingsQueries.current().queryKey,
				(settings) =>
					settings
						? {
								...settings,
								theme: themeState.preference,
							}
						: settings,
			);
		},
	});
}

export function useThemeUpdatedListener(
	onThemeUpdated?: (theme: ThemeState) => void,
) {
	const queryClient = useQueryClient();

	useEffect(() => {
		return window.api.theme.onUpdated((themeState) => {
			queryClient.setQueryData(themeQueries.current().queryKey, themeState);
			onThemeUpdated?.(themeState);
		});
	}, [onThemeUpdated, queryClient]);
}
