import type { IpcHandlerRegistrar } from "../ipc/ipc-handler";
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
		handler: (parsedPatch) => {
			const settings = updateSettings(parsedPatch);

			if (parsedPatch.theme) {
				applyThemePreference(parsedPatch.theme);
				broadcastThemeState();
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

			return settings;
		},
	});
}
