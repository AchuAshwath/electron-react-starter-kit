import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../settings/settings.types";

const {
	getSettingsMock,
	isSupportedMock,
	notificationConstructorMock,
	notificationInstances,
	showMock,
	updateSettingsMock,
} = vi.hoisted(() => ({
	getSettingsMock: vi.fn(),
	isSupportedMock: vi.fn(),
	notificationConstructorMock: vi.fn(),
	notificationInstances: [] as Array<{ body?: string; title: string }>,
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
		Notification: NotificationMock,
	};
});

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
	});

	it("does not show notifications until desktop notifications are enabled", () => {
		isSupportedMock.mockReturnValue(true);

		expect(showNotification({ title: "Export complete" })).toEqual({
			reason: "disabled",
			shown: false,
		});
		expect(notificationConstructorMock).not.toHaveBeenCalled();
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
	});
});
