import { Notification } from "electron";
import { getSettings, updateSettings } from "../settings/settings.store";
import type {
	NotificationPermissionState,
	ShowNotificationInput,
	ShowNotificationResult,
} from "./notifications.types";

export function getNotificationPermissionState(): NotificationPermissionState {
	const supported = Notification.isSupported();
	const desktopEnabled = supported
		? getSettings().notifications.desktopEnabled
		: false;

	return {
		desktopEnabled,
		status: getNotificationPermissionStatus(supported, desktopEnabled),
		supported,
	};
}

export function setDesktopNotificationsEnabled(
	desktopEnabled: boolean,
): NotificationPermissionState {
	const supported = Notification.isSupported();
	const nextDesktopEnabled = supported ? desktopEnabled : false;

	updateSettings({
		notifications: {
			desktopEnabled: nextDesktopEnabled,
		},
	});

	return getNotificationPermissionState();
}

export function showNotification(
	input: ShowNotificationInput,
): ShowNotificationResult {
	const permission = getNotificationPermissionState();

	if (!permission.supported) {
		return {
			reason: "unsupported",
			shown: false,
		};
	}

	if (!permission.desktopEnabled) {
		return {
			reason: "disabled",
			shown: false,
		};
	}

	new Notification({
		body: input.body,
		title: input.title,
	}).show();

	return {
		shown: true,
	};
}

function getNotificationPermissionStatus(
	supported: boolean,
	desktopEnabled: boolean,
): NotificationPermissionState["status"] {
	if (!supported) {
		return "unsupported";
	}

	return desktopEnabled ? "granted" : "denied";
}
