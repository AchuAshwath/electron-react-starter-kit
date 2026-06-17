import { describe, expect, it, vi } from "vitest";
import type { IpcHandlerRegistrar } from "../ipc/ipc-handler";
import { notificationIpcChannels } from "./notifications.channels";

const {
	broadcastSettingsMock,
	getNotificationPermissionStateMock,
	setDesktopNotificationsEnabledMock,
	showNotificationMock,
} = vi.hoisted(() => ({
	broadcastSettingsMock: vi.fn(),
	getNotificationPermissionStateMock: vi.fn(),
	setDesktopNotificationsEnabledMock: vi.fn(),
	showNotificationMock: vi.fn(),
}));

vi.mock("../settings/settings.ipc", () => {
	return {
		broadcastSettings: broadcastSettingsMock,
	};
});

vi.mock("./notifications.service", () => {
	return {
		getNotificationPermissionState: getNotificationPermissionStateMock,
		setDesktopNotificationsEnabled: setDesktopNotificationsEnabledMock,
		showNotification: showNotificationMock,
	};
});

const { registerNotificationIpcHandlers } = await import("./notifications.ipc");

function createTestRegistrar() {
	const handlers = new Map<string, Parameters<IpcHandlerRegistrar>[0]>();
	const registerIpcHandler: IpcHandlerRegistrar = vi.fn((options) => {
		handlers.set(options.channel, options);
	});

	registerNotificationIpcHandlers(registerIpcHandler);

	return {
		handlers,
		registerIpcHandler,
	};
}

describe("registerNotificationIpcHandlers", () => {
	it("registers notification handlers", () => {
		const { registerIpcHandler } = createTestRegistrar();

		expect(registerIpcHandler).toHaveBeenCalledWith(
			expect.objectContaining({
				channel: notificationIpcChannels.getPermission,
			}),
		);
		expect(registerIpcHandler).toHaveBeenCalledWith(
			expect.objectContaining({
				channel: notificationIpcChannels.requestPermission,
			}),
		);
		expect(registerIpcHandler).toHaveBeenCalledWith(
			expect.objectContaining({
				channel: notificationIpcChannels.setDesktopEnabled,
			}),
		);
		expect(registerIpcHandler).toHaveBeenCalledWith(
			expect.objectContaining({
				channel: notificationIpcChannels.show,
			}),
		);
	});

	it("requests desktop notification permission and broadcasts settings", () => {
		const { handlers } = createTestRegistrar();
		const permission = {
			desktopEnabled: true,
			status: "granted",
			supported: true,
		};
		setDesktopNotificationsEnabledMock.mockReturnValue(permission);

		expect(
			handlers
				.get(notificationIpcChannels.requestPermission)
				?.handler(undefined, {} as never),
		).toEqual(permission);
		expect(setDesktopNotificationsEnabledMock).toHaveBeenCalledWith(true);
		expect(broadcastSettingsMock).toHaveBeenCalledTimes(1);
	});

	it("shows notifications through the service", () => {
		const { handlers } = createTestRegistrar();
		const result = { shown: true };
		showNotificationMock.mockReturnValue(result);

		expect(
			handlers
				.get(notificationIpcChannels.show)
				?.handler({ title: "Export complete" }, {} as never),
		).toEqual(result);
		expect(showNotificationMock).toHaveBeenCalledWith({
			title: "Export complete",
		});
	});
});
