import type { IpcHandlerRegistrar } from "../ipc/ipc-handler";
import { broadcastSettings } from "../settings/settings.ipc";
import { notificationIpcChannels } from "./notifications.channels";
import {
	getNotificationPermissionState,
	setDesktopNotificationsEnabled,
	showNotification,
} from "./notifications.service";
import {
	desktopNotificationsEnabledSchema,
	type NotificationPermissionState,
	type ShowNotificationResult,
	showNotificationInputSchema,
} from "./notifications.types";

export function registerNotificationIpcHandlers(
	registerIpcHandler: IpcHandlerRegistrar,
): void {
	registerIpcHandler({
		channel: notificationIpcChannels.getPermission,
		handler: (): NotificationPermissionState => {
			return getNotificationPermissionState();
		},
	});

	registerIpcHandler({
		channel: notificationIpcChannels.requestPermission,
		handler: (): NotificationPermissionState => {
			const permission = setDesktopNotificationsEnabled(true);

			broadcastSettings();

			return permission;
		},
	});

	registerIpcHandler({
		channel: notificationIpcChannels.setDesktopEnabled,
		input: desktopNotificationsEnabledSchema,
		handler: (desktopEnabled): NotificationPermissionState => {
			const permission = setDesktopNotificationsEnabled(desktopEnabled);

			broadcastSettings();

			return permission;
		},
	});

	registerIpcHandler({
		channel: notificationIpcChannels.show,
		input: showNotificationInputSchema,
		handler: (input): ShowNotificationResult => {
			return showNotification(input);
		},
	});
}
