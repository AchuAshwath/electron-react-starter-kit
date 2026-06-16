import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { settingsQueries } from "../settings/settings.queries";
import { applyThemeClass } from "./theme.dom";
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
		onMutate: async (themePreference) => {
			await queryClient.cancelQueries({
				queryKey: themeQueries.current().queryKey,
			});

			const previousTheme = queryClient.getQueryData<ThemeState>(
				themeQueries.current().queryKey,
			);

			applyThemeClass(resolveThemePreference(themePreference, previousTheme));

			return { previousTheme };
		},
		onError: (_error, _themePreference, context) => {
			if (context?.previousTheme) {
				applyThemeClass(context.previousTheme.resolvedTheme);
			}
		},
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

function resolveThemePreference(
	themePreference: ThemePreference,
	currentTheme: ThemeState | undefined,
) {
	if (themePreference === "system") {
		return currentTheme?.systemPrefersDark ? "dark" : "light";
	}

	return themePreference;
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
