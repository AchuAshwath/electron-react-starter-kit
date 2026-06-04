import { ipcMain } from "electron";
import {
	applyThemePreference,
	broadcastThemeState,
} from "../theme/theme.service";
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
		const settings = updateSettings(parsedPatch);

		if (parsedPatch.theme) {
			applyThemePreference(parsedPatch.theme);
			broadcastThemeState();
		}

		return settings;
	});

	ipcMain.handle(settingsIpcChannels.reset, () => {
		const settings = resetSettings();

		applyThemePreference(settings.theme);
		broadcastThemeState();

		return settings;
	});
}
