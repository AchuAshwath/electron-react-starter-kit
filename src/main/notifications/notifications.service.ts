import { BrowserWindow, Notification } from "electron";
import { notificationLogger } from "../logging/logger";
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

	notificationLogger.info("Desktop notifications preference changed", {
		enabled: nextDesktopEnabled,
		supported,
	});

	return getNotificationPermissionState();
}

export function showNotification(
	input: ShowNotificationInput,
): ShowNotificationResult {
	const permission = getNotificationPermissionState();

	if (!permission.supported) {
		notificationLogger.warn("Native notification skipped", {
			reason: "unsupported",
		});

		return {
			reason: "unsupported",
			shown: false,
		};
	}

	if (!permission.desktopEnabled) {
		notificationLogger.info("Native notification skipped", {
			reason: "disabled",
		});

		return {
			reason: "disabled",
			shown: false,
		};
	}

	if (!input.showWhenFocused && BrowserWindow.getFocusedWindow()) {
		notificationLogger.info("Native notification skipped", {
			reason: "focused",
		});

		return {
			reason: "focused",
			shown: false,
		};
	}

	new Notification({
		body: input.body,
		title: input.title,
	}).show();

	notificationLogger.info("Native notification sent", {
		showWhenFocused: input.showWhenFocused === true,
	});

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
