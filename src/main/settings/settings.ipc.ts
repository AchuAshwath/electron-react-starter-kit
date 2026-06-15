import { BrowserWindow } from "electron";
import type { IpcHandlerRegistrar } from "../ipc/ipc-handler";
import {
	applyThemePreference,
	broadcastThemeState,
} from "../theme/theme.service";
import { settingsUpdatedChannel } from "./settings.channels";
import { getSettings, resetSettings, updateSettings } from "./settings.store";
import { type UserSettings, userSettingsPatchSchema } from "./settings.types";

export const settingsIpcChannels = {
	get: "settings:get",
	update: "settings:update",
	reset: "settings:reset",
} as const;

export function broadcastSettings(
	settings: UserSettings = getSettings(),
): void {
	for (const window of BrowserWindow.getAllWindows()) {
		window.webContents.send(settingsUpdatedChannel, settings);
	}
}

export function registerSettingsIpcHandlers(
	registerIpcHandler: IpcHandlerRegistrar,
): void {
	registerIpcHandler({
		channel: settingsIpcChannels.get,
		handler: () => {
			return getSettings();
		},
	});

	registerIpcHandler({
		channel: settingsIpcChannels.update,
		input: userSettingsPatchSchema,
		handler: (parsedPatch, event) => {
			const settings = updateSettings(parsedPatch);

			if (parsedPatch.theme) {
				applyThemePreference(parsedPatch.theme);
				broadcastThemeState();
			}

			if (parsedPatch.windowBounds) {
				const window = BrowserWindow.fromWebContents(event.sender);

				window?.setSize(
					settings.windowBounds.width,
					settings.windowBounds.height,
				);
				broadcastSettings(settings);
			}

			return settings;
		},
	});

	registerIpcHandler({
		channel: settingsIpcChannels.reset,
		handler: () => {
			const settings = resetSettings();

			applyThemePreference(settings.theme);
			broadcastThemeState();
			broadcastSettings(settings);

			return settings;
		},
	});
}
