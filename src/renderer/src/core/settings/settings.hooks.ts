import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { settingsQueries } from "./settings.queries";

type UserSettings = Awaited<ReturnType<Window["api"]["settings"]["get"]>>;

export function useSettings() {
	return useQuery(settingsQueries.current());
}

export function useUpdateSettings() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: window.api.settings.update,
		onSuccess: (settings) => {
			queryClient.setQueryData(settingsQueries.current().queryKey, settings);
		},
	});
}

export function useResetSettings() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: window.api.settings.reset,
		onSuccess: (settings) => {
			queryClient.setQueryData(settingsQueries.current().queryKey, settings);
		},
	});
}

export function useSettingsUpdatedListener(
	onSettingsUpdated?: (settings: UserSettings) => void,
) {
	const queryClient = useQueryClient();

	useEffect(() => {
		return window.api.settings.onUpdated((settings) => {
			queryClient.setQueryData(settingsQueries.current().queryKey, settings);
			onSettingsUpdated?.(settings);
		});
	}, [onSettingsUpdated, queryClient]);
}
