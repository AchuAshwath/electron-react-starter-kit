import { ipcMain } from "electron";
import { getSettings, resetSettings, updateSettings } from "./settings.store";
import { userSettingsPatchSchema } from "./settings.types";

export const settingsIpcChannels = {
	get: "settings:get",
	update: "settings:update",
	reset: "settings:reset",
} as const;

export function registerSettingsIpcHandlers(): void {
	ipcMain.handle(settingsIpcChannels.get, () => {
		return getSettings();
	});

	ipcMain.handle(settingsIpcChannels.update, (_, patch: unknown) => {
		const parsedPatch = userSettingsPatchSchema.parse(patch);

		return updateSettings(parsedPatch);
	});

	ipcMain.handle(settingsIpcChannels.reset, () => {
		return resetSettings();
	});
}
