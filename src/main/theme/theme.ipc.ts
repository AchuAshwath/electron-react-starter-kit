import { ipcMain, nativeTheme } from "electron";
import { themePreferenceSchema } from "../settings/settings.types";
import {
	broadcastThemeState,
	getThemeState,
	setThemePreference,
} from "./theme.service";

export const themeIpcChannels = {
	get: "theme:get",
	setPreference: "theme:set-preference",
	updated: "theme:updated",
} as const;

export function registerThemeIpcHandlers(): void {
	ipcMain.handle(themeIpcChannels.get, () => {
		return getThemeState();
	});

	ipcMain.handle(themeIpcChannels.setPreference, (_, preference: unknown) => {
		const parsedPreference = themePreferenceSchema.parse(preference);

		return setThemePreference(parsedPreference);
	});

	nativeTheme.on("updated", () => {
		broadcastThemeState();
	});
}
