import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../settings/settings.types";

const {
	getFocusedWindowMock,
	getSettingsMock,
	isSupportedMock,
	notificationConstructorMock,
	notificationInstances,
	notificationLoggerMock,
	showMock,
	updateSettingsMock,
} = vi.hoisted(() => ({
	getFocusedWindowMock: vi.fn(),
	getSettingsMock: vi.fn(),
	isSupportedMock: vi.fn(),
	notificationConstructorMock: vi.fn(),
	notificationInstances: [] as Array<{ body?: string; title: string }>,
	notificationLoggerMock: {
		info: vi.fn(),
		warn: vi.fn(),
	},
	showMock: vi.fn(),
	updateSettingsMock: vi.fn(),
}));

vi.mock("electron", () => {
	function NotificationMock(options: { body?: string; title: string }) {
		notificationConstructorMock(options);
		notificationInstances.push(options);

		return {
			show: showMock,
		};
	}

	NotificationMock.isSupported = isSupportedMock;

	return {
		BrowserWindow: {
			getFocusedWindow: getFocusedWindowMock,
		},
		Notification: NotificationMock,
	};
});

vi.mock("../logging/logger", () => ({
	notificationLogger: notificationLoggerMock,
}));

vi.mock("../settings/settings.store", () => {
	return {
		getSettings: getSettingsMock,
		updateSettings: updateSettingsMock,
	};
});

const {
	getNotificationPermissionState,
	setDesktopNotificationsEnabled,
	showNotification,
} = await import("./notifications.service");

describe("notifications service", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		notificationInstances.length = 0;
		getFocusedWindowMock.mockReturnValue(undefined);
		getSettingsMock.mockReturnValue(defaultSettings);
	});

	it("returns unsupported permission state when native notifications are unavailable", () => {
		isSupportedMock.mockReturnValue(false);

		expect(getNotificationPermissionState()).toEqual({
			desktopEnabled: false,
			status: "unsupported",
			supported: false,
		});
	});

	it("persists disabled when enabling on an unsupported platform", () => {
		isSupportedMock.mockReturnValue(false);

		expect(setDesktopNotificationsEnabled(true)).toEqual({
			desktopEnabled: false,
			status: "unsupported",
			supported: false,
		});
		expect(updateSettingsMock).toHaveBeenCalledWith({
			notifications: {
				desktopEnabled: false,
			},
		});
		expect(notificationLoggerMock.info).toHaveBeenCalledWith(
			"Desktop notifications preference changed",
			{
				enabled: false,
				supported: false,
			},
		);
	});

	it("does not show notifications until desktop notifications are enabled", () => {
		isSupportedMock.mockReturnValue(true);

		expect(showNotification({ title: "Export complete" })).toEqual({
			reason: "disabled",
			shown: false,
		});
		expect(notificationConstructorMock).not.toHaveBeenCalled();
		expect(notificationLoggerMock.info).toHaveBeenCalledWith(
			"Native notification skipped",
			{
				reason: "disabled",
			},
		);
	});

	it("shows a native notification when supported and enabled", () => {
		isSupportedMock.mockReturnValue(true);
		getSettingsMock.mockReturnValue({
			...defaultSettings,
			notifications: {
				desktopEnabled: true,
			},
		});

		expect(
			showNotification({
				body: "Your report is ready.",
				title: "Export complete",
			}),
		).toEqual({
			shown: true,
		});
		expect(notificationInstances).toEqual([
			{
				body: "Your report is ready.",
				title: "Export complete",
			},
		]);
		expect(showMock).toHaveBeenCalledTimes(1);
		expect(notificationLoggerMock.info).not.toHaveBeenCalled();
	});

	it("skips native notifications while the app is focused by default", () => {
		isSupportedMock.mockReturnValue(true);
		getFocusedWindowMock.mockReturnValue({});
		getSettingsMock.mockReturnValue({
			...defaultSettings,
			notifications: {
				desktopEnabled: true,
			},
		});

		expect(showNotification({ title: "Export complete" })).toEqual({
			reason: "focused",
			shown: false,
		});
		expect(notificationConstructorMock).not.toHaveBeenCalled();
	});

	it("can show an explicit test notification while the app is focused", () => {
		isSupportedMock.mockReturnValue(true);
		getFocusedWindowMock.mockReturnValue({});
		getSettingsMock.mockReturnValue({
			...defaultSettings,
			notifications: {
				desktopEnabled: true,
			},
		});

		expect(
			showNotification({
				showWhenFocused: true,
				title: "Notifications are ready",
			}),
		).toEqual({
			shown: true,
		});
		expect(notificationConstructorMock).toHaveBeenCalledWith({
			body: undefined,
			title: "Notifications are ready",
		});
	});
});
