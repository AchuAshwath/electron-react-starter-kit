import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsQueries } from "./settings.queries";

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
