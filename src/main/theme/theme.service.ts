import { BrowserWindow, nativeTheme } from "electron";
import { getSettings, updateSettings } from "../settings/settings.store";
import {
	type ThemePreference,
	themePreferenceSchema,
} from "../settings/settings.types";
import type { ResolvedTheme, ThemeState } from "./theme.types";

export const themeUpdatedChannel = "theme:updated";

export function resolveTheme(): ResolvedTheme {
	return nativeTheme.shouldUseDarkColors ? "dark" : "light";
}

export function getThemeState(): ThemeState {
	const { theme } = getSettings();

	return {
		preference: theme,
		resolvedTheme: resolveTheme(),
		systemPrefersDark: nativeTheme.shouldUseDarkColorsForSystemIntegratedUI,
	};
}

export function applyThemePreference(preference: ThemePreference): void {
	nativeTheme.themeSource = themePreferenceSchema.parse(preference);
}

export function setThemePreference(preference: ThemePreference): ThemeState {
	const parsedPreference = themePreferenceSchema.parse(preference);

	applyThemePreference(parsedPreference);
	updateSettings({ theme: parsedPreference });

	return getThemeState();
}

export function syncNativeThemeFromSettings(): ThemeState {
	const { theme } = getSettings();

	nativeTheme.themeSource = theme;

	return getThemeState();
}

export function broadcastThemeState(): ThemeState {
	const themeState = getThemeState();

	for (const window of BrowserWindow.getAllWindows()) {
		window.webContents.send(themeUpdatedChannel, themeState);
	}

	return themeState;
}
