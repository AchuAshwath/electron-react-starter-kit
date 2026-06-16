import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { settingsQueries } from "./settings.queries";

type UserSettings = Awaited<ReturnType<Window["api"]["settings"]["get"]>>;
type UserSettingsPatch = Parameters<Window["api"]["settings"]["update"]>[0];

export function useSettings() {
	return useQuery(settingsQueries.current());
}

export function useUpdateSettings() {
	const queryClient = useQueryClient();
	const queryKey = settingsQueries.current().queryKey;

	return useMutation({
		mutationFn: window.api.settings.update,
		onMutate: async (patch) => {
			await queryClient.cancelQueries({ queryKey });

			const previousSettings = queryClient.getQueryData<UserSettings>(queryKey);

			if (previousSettings) {
				queryClient.setQueryData(
					queryKey,
					mergeUserSettingsPatch(previousSettings, patch),
				);
			}

			return { previousSettings };
		},
		onError: (_error, _patch, context) => {
			if (context?.previousSettings) {
				queryClient.setQueryData(queryKey, context.previousSettings);
			}
		},
		onSuccess: (settings) => {
			queryClient.setQueryData(queryKey, settings);
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

function mergeUserSettingsPatch(
	settings: UserSettings,
	patch: UserSettingsPatch,
): UserSettings {
	return {
		...settings,
		...patch,
		windowBounds: patch.windowBounds
			? {
					...settings.windowBounds,
					...patch.windowBounds,
				}
			: settings.windowBounds,
		startup: patch.startup
			? {
					...settings.startup,
					...patch.startup,
				}
			: settings.startup,
	};
}
