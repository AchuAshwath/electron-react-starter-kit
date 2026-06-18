import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ShowNotificationInput } from "../../../../main/notifications/notifications.types";

export const notificationPermissionQueryKey = [
	"notifications",
	"permission",
] as const;

export function useNotificationPermission() {
	return useQuery({
		queryKey: notificationPermissionQueryKey,
		queryFn: () => window.api.notifications.getPermission(),
	});
}

export function useRequestNotificationPermission() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => window.api.notifications.requestPermission(),
		onSuccess: (permission) => {
			queryClient.setQueryData(notificationPermissionQueryKey, permission);
		},
	});
}

export function useSetDesktopNotificationsEnabled() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (desktopEnabled: boolean) =>
			window.api.notifications.setDesktopEnabled(desktopEnabled),
		onSuccess: (permission) => {
			queryClient.setQueryData(notificationPermissionQueryKey, permission);
		},
	});
}

export function useShowNotification() {
	return useMutation({
		mutationFn: (input: ShowNotificationInput) =>
			window.api.notifications.show(input),
	});
}
