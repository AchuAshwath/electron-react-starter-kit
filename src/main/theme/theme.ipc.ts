import { nativeTheme } from "electron";
import type { IpcHandlerRegistrar } from "../ipc/ipc-handler";
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

export function registerThemeIpcHandlers(
	registerIpcHandler: IpcHandlerRegistrar,
): void {
	registerIpcHandler({
		channel: themeIpcChannels.get,
		handler: () => {
			return getThemeState();
		},
	});

	registerIpcHandler({
		channel: themeIpcChannels.setPreference,
		input: themePreferenceSchema,
		handler: (preference) => {
			return setThemePreference(preference);
		},
	});

	nativeTheme.on("updated", () => {
		broadcastThemeState();
	});
}
